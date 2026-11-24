#!/usr/bin/env python3
"""SYNTHETIC / 脱敏 KV Cache 计算器（PLAY-03）。

只做算术，不连接 GPU、不修改配置。batch 不参与 KV 公式；
concurrent_sequences 只表示实际驻留序列数。
"""
from __future__ import annotations

import argparse
from dataclasses import dataclass


@dataclass(frozen=True)
class ModelShape:
    layers: int
    kv_heads: int
    head_dim: int
    bytes_per_element: int = 2  # BF16/FP16=2; FP8=1

    @property
    def bytes_per_token(self) -> int:
        # 2 is K + V, not batch size.
        return self.layers * 2 * self.kv_heads * self.head_dim * self.bytes_per_element


def positive_int(value: str) -> int:
    number = int(value)
    if number <= 0:
        raise argparse.ArgumentTypeError("must be a positive integer")
    return number


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--layers", type=positive_int, default=32)
    parser.add_argument("--kv-heads", type=positive_int, default=8)
    parser.add_argument("--head-dim", type=positive_int, default=128)
    parser.add_argument("--bytes-per-element", type=positive_int, choices=(1, 2, 4), default=2)
    parser.add_argument("--sequence-length", type=positive_int, default=4096)
    parser.add_argument("--concurrent-sequences", type=positive_int, default=8)
    parser.add_argument("--batch-size", type=positive_int, default=16, help="reported only; never multiplied into KV")
    parser.add_argument("--mixed-lengths", default="4096,4096,4096,4096,2048,2048,2048,2048")
    args = parser.parse_args()

    shape = ModelShape(args.layers, args.kv_heads, args.head_dim, args.bytes_per_element)
    per_sequence = shape.bytes_per_token * args.sequence_length
    equal_length_total = per_sequence * args.concurrent_sequences
    lengths = [positive_int(value) for value in args.mixed_lengths.split(",") if value]
    mixed_total = shape.bytes_per_token * sum(lengths)

    print("data_classification: synthetic/脱敏")
    print(f"bytes_per_token={shape.bytes_per_token}")
    print(f"bytes_per_sequence={per_sequence}")
    print(f"MiB_per_sequence={per_sequence / 2**20:.6f}")
    print(f"equal_length_GiB={equal_length_total / 2**30:.6f}")
    print(f"batch_size_reported={args.batch_size} (excluded_from_formula=true)")
    print(f"mixed_sequence_count={len(lengths)} mixed_tokens={sum(lengths)}")
    print(f"mixed_length_GiB={mixed_total / 2**30:.6f}")
    print("excluded=weights,activations,communication_buffers,allocator_fragmentation,safety_margin")

    if args.bytes_per_element == 1:
        print("note: FP8 KV bytes assume the deployed kernel actually stores one byte/element.")


if __name__ == "__main__":
    main()
