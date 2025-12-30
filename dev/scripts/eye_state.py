from __future__ import annotations

import argparse
import sys
import time
import ctypes
from datetime import datetime
from typing import Dict, Iterator, Optional, Sequence, Tuple

import numpy as np
from scipy import signal


def _as_1d_float_array(x: np.ndarray) -> np.ndarray:
    x = np.asarray(x, dtype=float)
    if x.ndim == 0:
        return x.reshape(1)
    if x.ndim == 1:
        return x
    if x.ndim == 2 and x.shape[1] == 1:
        return x[:, 0]
    raise ValueError(f"Expected shape (samples,) or (samples, 1); got {x.shape}")


def design_bandpass_sos(fs_hz: float, low_hz: float = 0.1, high_hz: float = 10.0, order: int = 4):
    if not (0.0 < low_hz < high_hz < fs_hz / 2.0):
        raise ValueError("Band-pass must satisfy 0 < low < high < Nyquist")
    return signal.butter(order, [low_hz, high_hz], btype="bandpass", fs=fs_hz, output="sos")


def make_config(
    *,
    fs_hz: float,
    low_hz: float,
    high_hz: float,
    filter_order: int,
    refractory_ms: float,
    fixed_threshold: Optional[float],
    adaptive_k: float,
    adaptive_window_s: float,
    slope_k: float,
    warmup_s: float,
) -> Dict[str, float | int | None]:
    return {
        "fs_hz": float(fs_hz),
        "low_hz": float(low_hz),
        "high_hz": float(high_hz),
        "filter_order": int(filter_order),
        "refractory_ms": float(refractory_ms),
        "fixed_threshold": None if fixed_threshold is None else float(fixed_threshold),
        "adaptive_k": float(adaptive_k),
        "adaptive_window_s": float(adaptive_window_s),
        "adaptive_min_threshold": 0.0,
        "slope_k": float(slope_k),
        "warmup_s": float(warmup_s),
        "dc_tau_s": 2.0,
    }


def make_detector_state(cfg: Dict[str, float | int | None]) -> Dict[str, object]:
    fs_hz = float(cfg["fs_hz"])
    sos = design_bandpass_sos(
        fs_hz=fs_hz,
        low_hz=float(cfg["low_hz"]),
        high_hz=float(cfg["high_hz"]),
        order=int(cfg["filter_order"]),
    )
    zi = signal.sosfilt_zi(sos)

    dc_tau_s = float(cfg["dc_tau_s"])
    dc_alpha = float(np.exp(-1.0 / (fs_hz * dc_tau_s)))

    window_len = max(16, int(round(float(cfg["adaptive_window_s"]) * fs_hz)))
    stats_buf = np.empty(window_len, dtype=float)
    stats_n = 0
    stats_idx = 0

    refractory_samples = int(round((float(cfg["refractory_ms"]) / 1000.0) * fs_hz))
    warmup_samples = int(round(float(cfg["warmup_s"]) * fs_hz))

    return {
        "sos": sos,
        "zi": zi,
        "dc_mean": 0.0,
        "dc_alpha": dc_alpha,
        "stats_buf": stats_buf,
        "stats_n": stats_n,
        "stats_idx": stats_idx,
        "abs_prev": 0.0,
        "sample_index": 0,
        "last_blink_index": -10**9,
        "refractory_samples": refractory_samples,
        "warmup_samples": warmup_samples,
    }


def _stats_view(state: Dict[str, object]) -> np.ndarray:
    buf = state["stats_buf"]
    assert isinstance(buf, np.ndarray)
    n = int(state["stats_n"])
    idx = int(state["stats_idx"])

    if n <= 0:
        return buf[:0]
    if n < buf.size:
        return buf[:n]
    return np.concatenate((buf[idx:], buf[:idx]))


def update_rolling_stats(state: Dict[str, object], value: float) -> None:
    buf = state["stats_buf"]
    assert isinstance(buf, np.ndarray)

    idx = int(state["stats_idx"])
    n = int(state["stats_n"])
    buf[idx] = float(value)
    idx = (idx + 1) % buf.size
    n = min(n + 1, buf.size)
    state["stats_idx"] = idx
    state["stats_n"] = n


def robust_median_and_sigma(state: Dict[str, object]) -> Tuple[float, float]:
    v = _stats_view(state)
    if v.size == 0:
        return 0.0, 0.0
    median = float(np.median(v))
    mad = float(np.median(np.abs(v - median)))
    sigma = 1.4826 * mad
    return median, sigma


def esc_pressed() -> bool:
    if sys.platform != "win32":
        return False
    try:
        import msvcrt
        if not msvcrt.kbhit():
            return False
        ch = msvcrt.getwch()
        return ch == "\x1b"
    except Exception:
        return False


def startup_delay(seconds: int = 5) -> None:
    for remaining in range(int(seconds), 0, -1):
        print(f"Starting in {remaining}... (press ESC to cancel)", flush=True)
        for _ in range(10):
            if esc_pressed():
                print("Stopped (ESC).", flush=True)
                raise SystemExit(0)
            time.sleep(0.1)


def press_down_arrow() -> None:
    if sys.platform != "win32":
        print("DOWN_ARROW", flush=True)
        return

    VK_DOWN = 0x28
    KEYEVENTF_KEYUP = 0x0002
    INPUT_KEYBOARD = 1

    class KEYBDINPUT(ctypes.Structure):
        _fields_ = [
            ("wVk", ctypes.c_ushort),
            ("wScan", ctypes.c_ushort),
            ("dwFlags", ctypes.c_ulong),
            ("time", ctypes.c_ulong),
            ("dwExtraInfo", ctypes.POINTER(ctypes.c_ulong)),
        ]

    class INPUT_UNION(ctypes.Union):
        _fields_ = [("ki", KEYBDINPUT)]

    class INPUT(ctypes.Structure):
        _fields_ = [("type", ctypes.c_ulong), ("union", INPUT_UNION)]

    SendInput = ctypes.windll.user32.SendInput

    def _send(vk: int, flags: int) -> None:
        extra = ctypes.c_ulong(0)
        inp = INPUT(type=INPUT_KEYBOARD, union=INPUT_UNION(ki=KEYBDINPUT(vk, 0, flags, 0, ctypes.pointer(extra))))
        SendInput(1, ctypes.byref(inp), ctypes.sizeof(INPUT))

    _send(VK_DOWN, 0)
    _send(VK_DOWN, KEYEVENTF_KEYUP)


def compute_threshold(cfg: Dict[str, float | int | None], state: Dict[str, object]) -> Tuple[float, float, float]:
    fixed_thr = cfg.get("fixed_threshold")
    if fixed_thr is not None:
        return float(fixed_thr), 0.0, 0.0

    baseline, sigma = robust_median_and_sigma(state)
    thr = baseline + float(cfg["adaptive_k"]) * sigma
    thr = max(thr, float(cfg["adaptive_min_threshold"]))
    return thr, baseline, sigma


def remove_dc(state: Dict[str, object], x: float) -> float:
    dc_mean = float(state["dc_mean"])
    dc_alpha = float(state["dc_alpha"])
    dc_mean = dc_alpha * dc_mean + (1.0 - dc_alpha) * float(x)
    state["dc_mean"] = dc_mean
    return float(x) - dc_mean


def process_sample(
    cfg: Dict[str, float | int | None],
    state: Dict[str, object],
    x_raw: float,
) -> Tuple[float, bool, float]:
    x = remove_dc(state, x_raw)
    sos = state["sos"]
    zi = state["zi"]
    y, zi_new = signal.sosfilt(sos, [x], zi=zi)
    state["zi"] = zi_new
    y = float(y[0])

    abs_y = abs(y)
    update_rolling_stats(state, abs_y)
    thr, _baseline, sigma = compute_threshold(cfg, state)

    sample_index = int(state["sample_index"])
    warmup_samples = int(state["warmup_samples"])
    refractory_samples = int(state["refractory_samples"])
    last_blink_index = int(state["last_blink_index"])
    abs_prev = float(state["abs_prev"])

    blink = False
    if sample_index >= warmup_samples:
        if (sample_index - last_blink_index) >= refractory_samples:
            crossed_up = (abs_prev <= thr) and (abs_y > thr)
            slope_thr = 0.0 if (cfg.get("fixed_threshold") is not None) else (float(cfg["slope_k"]) * sigma)
            slope_ok = (abs_y - abs_prev) >= slope_thr
            if crossed_up and slope_ok:
                blink = True
                state["last_blink_index"] = sample_index

    state["abs_prev"] = abs_y
    state["sample_index"] = sample_index + 1
    return y, blink, thr


def trigger_button_press() -> None:
    press_down_arrow()


def log_blink(ts: datetime, t_seconds: float) -> None:
    print(f"{ts.isoformat(timespec='milliseconds')} | blink | t={t_seconds:0.3f}s", flush=True)


def iter_csv_samples(path: str) -> np.ndarray:
    data = np.genfromtxt(path, delimiter=",", dtype=float)
    data = _as_1d_float_array(data)
    data = data[np.isfinite(data)]
    if data.size == 0:
        raise ValueError("No numeric samples found in CSV")
    return data


def iter_stdin_floats() -> Iterator[float]:
    for line in sys.stdin:
        s = line.strip()
        if not s:
            continue
        try:
            yield float(s)
        except ValueError:
            continue


def run_offline(samples: np.ndarray, cfg: Dict[str, float | int | None], state: Dict[str, object], plot: bool) -> int:
    filtered = np.zeros_like(samples, dtype=float)
    thresholds = np.zeros_like(samples, dtype=float)
    blink_indices: list[int] = []

    start_wall = datetime.now()
    fs_hz = float(cfg["fs_hz"])
    for i, x in enumerate(samples):
        if esc_pressed():
            print("Stopped (ESC).", flush=True)
            break
        y, blink, thr = process_sample(cfg, state, float(x))
        filtered[i] = y
        thresholds[i] = thr
        if blink:
            t_s = i / fs_hz
            log_blink(start_wall, t_s)
            trigger_button_press()
            blink_indices.append(i)

    if plot:
        import matplotlib.pyplot as plt

        t = np.arange(samples.size) / fs_hz
        plt.figure(figsize=(12, 5))
        plt.title("EOG-based blink detection (VEOG): filtered signal + detections")
        plt.plot(t, filtered, label="Filtered VEOG (0.1–10 Hz)", linewidth=1.0)
        if cfg.get("fixed_threshold") is None:
            plt.plot(t, thresholds, label="Adaptive threshold (|y|)", linewidth=1.0, alpha=0.8)
            plt.plot(t, -thresholds, linewidth=1.0, alpha=0.8)
        else:
            thr = float(cfg["fixed_threshold"])
            plt.axhline(thr, linestyle="--", alpha=0.6, label="Fixed threshold")
            plt.axhline(-thr, linestyle="--", alpha=0.6)

        if blink_indices:
            plt.scatter(
                np.array(blink_indices) / fs_hz,
                filtered[np.array(blink_indices)],
                color="red",
                s=25,
                label="Blink",
                zorder=5,
            )

        plt.xlabel("Time (s)")
        plt.ylabel("Amplitude (a.u.)")
        plt.grid(True, alpha=0.25)
        plt.legend(loc="upper right")
        plt.tight_layout()
        plt.show()

    return 0


def run_streaming_stdin(cfg: Dict[str, float | int | None], state: Dict[str, object]) -> int:
    start_monotonic = time.monotonic()
    fs_hz = float(cfg["fs_hz"])
    for i, x in enumerate(iter_stdin_floats()):
        if esc_pressed():
            print("Stopped (ESC).", flush=True)
            break
        _y, blink, _thr = process_sample(cfg, state, x)
        if blink:
            t_s = i / fs_hz
            log_blink(datetime.now(), t_s)
            trigger_button_press()
    return 0


def build_arg_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description=(
            "EOG-based blink detection (VEOG) at 128 Hz. "
            "Band-pass 0.1–10 Hz + adaptive threshold + refractory (single press per blink)."
        )
    )

    src = p.add_mutually_exclusive_group(required=True)
    src.add_argument("--csv", type=str, help="Path to CSV containing a single EOG column")
    src.add_argument(
        "--stdin",
        action="store_true",
        help="Read one float sample per line from stdin (continuous stream)",
    )

    p.add_argument("--fs", type=float, default=128.0, help="Sampling rate in Hz (default: 128)")
    p.add_argument("--low", type=float, default=0.1, help="Band-pass low cutoff in Hz (default: 0.1)")
    p.add_argument("--high", type=float, default=10.0, help="Band-pass high cutoff in Hz (default: 10)")
    p.add_argument("--order", type=int, default=4, help="Butterworth order (default: 4)")

    p.add_argument(
        "--refractory-ms",
        type=float,
        default=400.0,
        help="Refractory period in ms to avoid double-detections (default: 400)",
    )

    p.add_argument(
        "--threshold",
        type=float,
        default=None,
        help="Fixed amplitude threshold on |filtered| (disables adaptive threshold)",
    )
    p.add_argument(
        "--k",
        type=float,
        default=6.0,
        help="Adaptive threshold factor: threshold = median(|y|) + k*sigma (sigma from MAD). Default: 6",
    )
    p.add_argument(
        "--window-s",
        type=float,
        default=2.0,
        help="Adaptive stats window in seconds (default: 2.0)",
    )
    p.add_argument(
        "--slope-k",
        type=float,
        default=1.0,
        help="Slope gate factor (in sigma units) to reject slow eye movements (default: 1.0)",
    )
    p.add_argument(
        "--warmup-s",
        type=float,
        default=1.0,
        help="Warmup duration in seconds before enabling detection (default: 1.0)",
    )
    p.add_argument("--plot", action="store_true", help="Plot filtered signal and detections (CSV mode only)")
    return p


def main(argv: Optional[Sequence[str]] = None) -> int:
    args = build_arg_parser().parse_args(argv)

    startup_delay(5)

    cfg = make_config(
        fs_hz=float(args.fs),
        low_hz=float(args.low),
        high_hz=float(args.high),
        filter_order=int(args.order),
        refractory_ms=float(args.refractory_ms),
        fixed_threshold=None if args.threshold is None else float(args.threshold),
        adaptive_k=float(args.k),
        adaptive_window_s=float(args.window_s),
        slope_k=float(args.slope_k),
        warmup_s=float(args.warmup_s),
    )
    state = make_detector_state(cfg)

    if args.csv:
        samples = iter_csv_samples(args.csv)
        return run_offline(samples=samples, cfg=cfg, state=state, plot=bool(args.plot))

    if args.stdin:
        print("EOG-based blink detection (VEOG) | reading samples from stdin...", flush=True)
        return run_streaming_stdin(cfg=cfg, state=state)

    return 2


if __name__ == "__main__":
    raise SystemExit(main())
