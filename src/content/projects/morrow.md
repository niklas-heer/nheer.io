---
title: "Morrow"
tagline: "Readable code, native programs."
summary: >-
  A statically typed, functional programming language with Python-like syntax.
  Immutable values, pattern matching and explicit errors, compiled to native
  executables by a Rust compiler with a Cranelift backend.
category: tools
status: active
visibility: public
repo: "morrow-lang/morrow"
started: 2026-01-27
stack: ["Rust", "Cranelift", "WebAssembly"]
cover: "./morrow/cover.webp"
coverAlt: "A terminal showing a short Morrow program with a Plant type, a check function returning a Result and a match over Ok and Err, followed by morrow run printing which plants need water"
gallery:
  - src: "./morrow/native-build.webp"
    alt: "morrow build creating a native executable called water of about 1 MB, which then prints the same three lines"
    caption: "The same program as a native executable"
highlights:
  - "Indentation-based syntax with inferred types"
  - "Option, Result and exhaustive matches"
  - "Formatter, REPL, tests and LSP included"
---

Morrow is a programming language I'm building for command-line tools and applications. The goal is code that reads about as easily as Python, with a type checker and pattern matching catching mistakes before the program runs.

Code is indentation-based, types are inferred, and bindings are immutable. Absence and failure are values: a function returns an `Option` or a `Result`, and the compiler insists that a `match` covers every case. Forget the `Err` branch in the picture and `morrow check` refuses with "match must be exhaustive", naming what is missing. Traits, compile-time constants, typed JSON and deferred cleanup are there too.

`morrow run` compiles and executes in one step, and `morrow build` leaves a native executable that runs without the compiler. The compiler, runtime, language server and tools are written in Rust, with Cranelift generating the machine code. A formatter, a REPL, a test runner and a documentation generator ship with it.

The more ambitious direction is full-stack. The same typed Morrow code can run as supervised actors on a native server and as a WebAssembly client in the browser, with updates over WebSockets and offline reading. A collaborative checklist is the working demo of that, and the repository documents a three-node cluster setup with its delivery guarantees.

The project started in January 2026 under the name Fern. In September its implementation moved to a Rust workspace with Cranelift, and the language got its new name. It is an early preview: native builds are verified on macOS and Linux on ARM64, and the syntax and APIs are still changing. There are no release packages yet, so trying it means building from source.
