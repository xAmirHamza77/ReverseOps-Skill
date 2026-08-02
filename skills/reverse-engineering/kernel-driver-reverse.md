# Kernel Driver Reversing Reference

> Covers Windows/Linux kernel driver reversing, rootkit analysis, and C/C++ binary pattern recognition.

---

## Windows Driver Reversing

### Driver Types

| Type | Characteristics | Analysis focus |
|------|------|---------|
| WDM (Windows Driver Model) | Legacy drivers; manually manages IRPs | DriverEntry → device creation → Dispatch routines |
| KMDF (Kernel Mode Driver Framework) | Modern framework; event-driven | EvtDriverDeviceAdd → Queue → I/O callbacks |
| WDF (Windows Driver Foundation) | Umbrella term for KMDF + UMDF | Look for WdfDriverCreate calls |
| Minifilter | Filesystem filter driver | FltRegisterFilter → Pre/Post callbacks |

### WDM Driver Analysis Workflow

```text
1. Find DriverEntry (entry point)
   - IDA identifies it automatically, or search for IoCreateDevice / IoCreateSymbolicLink

2. Find the device name and symbolic link
   - IoCreateDevice → DeviceName (e.g. \Device\MyDriver)
   - IoCreateSymbolicLink → SymLink (e.g. \DosDevices\MyDriver)

3. Find the Dispatch routines
   - DriverObject->MajorFunction[IRP_MJ_DEVICE_CONTROL] = DispatchIoctl
   - This is the entry point invoked from user mode via DeviceIoControl

4. Analyze IOCTL handling
   - switch(IoControlCode) dispatches different functionality
   - IOCTL encoding: CTL_CODE(DeviceType, Function, Method, Access)
   - Method: METHOD_BUFFERED / METHOD_IN_DIRECT / METHOD_OUT_DIRECT / METHOD_NEITHER

5. Hunt for vulnerabilities
   - Unvalidated user-controlled buffer length → overflow
   - METHOD_NEITHER using user pointers directly → arbitrary read/write
   - Unchecked IOCTL permissions → callable by unprivileged users
```

### Decoding IOCTL Codes

```python
# Decode an IOCTL code
def decode_ioctl(code):
    device_type = (code >> 16) & 0xFFFF
    access = (code >> 14) & 0x3
    function = (code >> 2) & 0xFFF
    method = code & 0x3
    
    methods = {0: "BUFFERED", 1: "IN_DIRECT", 2: "OUT_DIRECT", 3: "NEITHER"}
    access_types = {0: "ANY", 1: "READ", 2: "WRITE", 3: "READ|WRITE"}
    
    return f"DevType=0x{device_type:X} Func=0x{function:X} Method={methods[method]} Access={access_types[access]}"

# Example
decode_ioctl(0x80002034)
# DevType=0x8000 Func=0x80D Method=BUFFERED Access=ANY
```

### IDA Plugins

| Plugin | Purpose | Link |
|------|------|------|
| **Driver Buddy Reloaded** | Automatically identifies IOCTLs, Dispatch routines, device names | https://github.com/VoidSec/DriverBuddyReloaded |
| **WinDbg + IDA** | Kernel debugging combined with static analysis | Built in |
| **FLIRT/Lumina** | Identifies WDK library functions | Built into IDA |

### Reference Articles

- [Windows Drivers RE Methodology (VoidSec)](https://voidsec.com/windows-drivers-reverse-engineering-methodology/) — The most complete WDM driver reversing methodology
- [Driver Reversing 101](https://eversinc33.com/posts/driver-reversing.html) — WDM vs KMDF comparison
- [Methodology of Reversing Vulnerable Killer Drivers](https://whiteknightlabs.com/2025/10/28/methodology-of-reversing-vulnerable-killer-drivers/) — Vulnerable-driver analysis

---

## Linux Kernel Module Reversing

### LKM (Loadable Kernel Module) Structure

```text
Key functions:
- init_module / module_init → executed when the module is loaded
- cleanup_module / module_exit → executed when the module is unloaded

Key structures:
- struct file_operations → open/read/write/ioctl for character devices
- struct net_device_ops → network device operations
- struct block_device_operations → block device operations
```

### Analysis Workflow

```text
1. Confirm it is a kernel module
   file module.ko → "ELF 64-bit ... relocatable" (note: relocatable, not executable)

2. Find the init/exit functions
   readelf -s module.ko | grep -E "init_module|cleanup_module"
   or look for module info in the .modinfo section

3. Find the file_operations structure
   Search for register_chrdev / cdev_add / misc_register
   → Locate the fops structure → pinpoint the ioctl/read/write handlers

4. Analyze ioctl handling
   unlocked_ioctl / compat_ioctl functions
   → switch(cmd) dispatch

5. Hunt for rootkit behavior
   - Modified sys_call_table → syscall hooks
   - Modified /proc filesystem → hiding processes/files
   - Registered netfilter hooks → hiding network connections
   - Modified VFS layer → hiding files
```

### Common Rootkit Techniques

| Technique | Characteristics | Detection method |
|------|------|---------|
| syscall table hook | Modifies `sys_call_table` entries | Compare the in-memory table against the on-disk vmlinux |
| VFS hook | Modifies `file_operations` function pointers | Check whether fops pointers point outside the kernel code segment |
| Netfilter hook | `nf_register_net_hook` | Walk the netfilter hook lists |
| kprobe/ftrace hook | Registered kprobe or ftrace callbacks | Check the ftrace registration list |
| eBPF rootkit | Loads malicious BPF programs | `bpftool prog list` |
| DKOM | Directly modifies kernel objects (process lists) | Walk the task_struct list and compare against /proc |

### Tools

| Tool | Purpose |
|------|------|
| `crash` | Kernel dump analysis |
| `volatility3` | Memory forensics (Linux profile) |
| `dmesg` / `journalctl` | Kernel logs |
| `lsmod` / `/proc/modules` | List of loaded modules |
| `modinfo` | Module metadata |
| `strace` | Syscall tracing (user-space view) |

---

## C/C++ Reversing Pattern Recognition

### Common C Patterns

| Source pattern | Disassembly signature |
|---------|-----------|
| `if-else` | `cmp` + `jcc` (conditional jump) |
| `switch-case` | Jump table (`jmp [rax*8 + table]`) or a chain of `cmp` |
| `for` loop | `cmp` + `jl/jle` + loop body + `inc/add` + `jmp` back |
| `while` loop | Condition check at the top of the loop |
| `do-while` | Condition check at the bottom of the loop |
| Function pointer call | `call rax` or `call [reg+offset]` |
| `struct` access | `[reg+fixed offset]` (e.g. `[rdi+0x10]`) |
| `malloc` + usage | `call malloc` → return value kept in a register → subsequent accesses via register+offset |
| String comparison | `call strcmp` or `repe cmpsb` |

### C++-Specific Patterns

| Source pattern | Disassembly signature |
|---------|-----------|
| **Virtual function call** | `mov rax, [rcx]` (load vtable) → `call [rax+offset]` (call virtual function) |
| **Constructor** | Allocates memory → writes the vtable pointer → initializes members |
| **Destructor** | Cleans up members → may call `operator delete` |
| **this pointer** | The first argument (rcx/rdi) is the object pointer |
| **Inheritance** | The vtable contains parent virtual functions + child overrides |
| **Multiple inheritance** | Multiple vtable pointers inside the object (at different offsets) |
| **RTTI** | A `type_info` pointer precedes the vtable |
| **Exception handling** | `__cxa_throw` / `_CxxThrowException` |
| **STL containers** | `std::vector`: `{begin, end, capacity}` three-pointer structure |
| **std::string** | Small string optimization (SSO): short strings inline, long strings heap-allocated |

### vtable Reversing Method

```text
1. Find the vtable
   - Search for contiguous arrays of function pointers (in .rodata or .rdata)
   - In constructors, `mov [rcx], offset vtable` writes the vtable pointer

2. Determine the class hierarchy
   - At offset -8 before the vtable there is usually an RTTI pointer (if not stripped)
   - Multiple vtables sharing the first few entries → inheritance relationship

3. Annotate the virtual functions
   - vtable[0] is usually the destructor (or deleting destructor)
   - Then annotate by offset: vtable[1] = func1, vtable[2] = func2...

4. In IDA
   - Create a struct at the vtable address (each field is a function pointer)
   - Add comments to `call [rax+offset]` noting which virtual function is invoked
```

### Structure Recovery

```text
Method 1: Infer from access patterns
  mov eax, [rdi+0x00]  → field_0: int/ptr (4/8 bytes)
  mov ecx, [rdi+0x08]  → field_8: int/ptr
  movss xmm0, [rdi+0x10] → field_10: float

Method 2: Infer from sizeof
  call malloc(0x30) → structure size 0x30 (48 bytes)
  
Method 3: Infer from the constructor
  The constructor initializes all fields → field types and offsets become obvious

Method 4: Use IDA's "Create struct" feature
  Select the access patterns → Edit → Struct → Create struct from selection
```

---

## Common Compiler Signatures

| Compiler | Identifying traits |
|--------|---------|
| MSVC | `_security_cookie` checks, `__fastcall` calling convention, Rich Header |
| GCC | `__stack_chk_fail`, `-fstack-protector`, `.note.GNU-stack` |
| Clang/LLVM | Similar to GCC but different optimization patterns, `__asan_*` (if sanitizers enabled) |
| MinGW | GCC traits + Windows API calls |
| AOSP Clang | Android-specific `__android_log_print`, PGO markers |

### Optimization-Level Recognition

| Optimization level | Traits |
|---------|------|
| -O0 | Lots of redundant movs, every variable on the stack, no inlining |
| -O1 | Basic optimizations, some variables in registers |
| -O2 | Loop unrolling, function inlining, tail-call optimization |
| -O3 / -Os | Aggressive inlining, vectorization (SIMD), hard-to-read code |
| PGO | Hot-path optimization, cold code split into `.text.cold` |
| LTO | Cross-module inlining, global dead-code elimination |

---

## Kernel Debugging Environments

### Windows

```text
Debugger: WinDbg Preview
Connection: network debugging (recommended) or serial port

Debuggee setup:
bcdedit /debug on
bcdedit /dbgsettings net hostip:192.168.x.x port:50000

Debugger connection:
WinDbg → File → Attach to Kernel → Net → Port:50000 Key:xxx

Common commands:
!analyze -v          # Automatic crash analysis
lm                   # List loaded modules
!drvobj \Driver\xxx  # Inspect a driver object
dt nt!_DRIVER_OBJECT # Display a structure
bp module!function   # Set a breakpoint
```

### Linux

```text
Debugger: GDB + QEMU or kgdb

QEMU kernel debugging:
qemu-system-x86_64 -kernel bzImage -s -S ...
gdb vmlinux -ex "target remote :1234"

Common commands:
info threads         # Kernel threads
lx-symbols           # Load kernel symbols (requires scripts/gdb/)
p init_task          # Inspect the init process
lx-dmesg             # Kernel logs
```

---

## Reference Resources

| Resource | Description | Link |
|------|------|------|
| VoidSec Driver RE Methodology | Complete Windows WDM driver analysis workflow | https://voidsec.com/windows-drivers-reverse-engineering-methodology/ |
| Elastic Rootkit series | Linux rootkit taxonomy + detection | https://security-labs.elastic.co/security-labs/linux-rootkits-1-hooked-on-linux |
| Driver Buddy Reloaded | IDA driver analysis plugin | https://github.com/VoidSec/DriverBuddyReloaded |
| LOLDrivers | List of known-vulnerable drivers | https://www.loldrivers.io/ |
| Windows Driver Samples | Microsoft official driver examples | https://github.com/microsoft/Windows-driver-samples |
| Linux Kernel Module Programming | Kernel module development tutorial | https://sysprog21.github.io/lkmpg/ |
| Trail of Bits - Devirtualizing C++ | vtable reversing methods | https://blog.trailofbits.com/2017/02/13/devirtualizing-c-with-binary-ninja/ |
