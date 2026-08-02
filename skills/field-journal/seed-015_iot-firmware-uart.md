# [Seed] IoT router firmware extraction + UART root shell

## Scenario classification
Firmware / IoT security

## Target overview
A low/mid-range home router: download the firmware bin from the vendor's site, extract the squashfs with binwalk, then connect to the device's UART for a root shell and analyze its web admin interface and startup scripts.

## Full execution chain

### Part 1: Firmware analysis

1. Download the firmware file (vendor site / OpenWRT / dump the flash yourself)
2. Basic identification
   ```bash
   file firmware.bin
   binwalk firmware.bin                    # expect LZMA / SquashFS / U-Boot
   binwalk -E firmware.bin                 # entropy graph to check for encryption
   ```
3. Extraction
   ```bash
   binwalk -e firmware.bin
   cd _firmware.bin.extracted/squashfs-root
   ```
4. Key points of static analysis
   ```bash
   find . -name 'shadow' -exec cat {} \;          # default password hashes
   find . -name '*.cgi' -o -name 'lighttpd*'      # web services
   find . -name 'rcS' -o -name 'init.d'           # startup scripts
   grep -r 'telnetd\|busybox' .                   # suspicious backdoors
   strings $(find . -name 'httpd') | grep -i 'admin\|debug\|backdoor'
   ```
5. Crack `/etc/shadow` offline:
   ```bash
   john --wordlist=rockyou.txt shadow
   ```

### Part 2: Hardware UART

1. Open the case and inspect the PCB → look for an unpopulated 4-pin / 6-pin header (usually unsoldered pads or pins)
2. Identify pins with a multimeter
   - GND (connected to the ground plane)
   - VCC (3.3V, stable during boot)
   - TX (frequent level transitions during boot; outputs toward the PC)
   - RX (mostly static during boot)
3. Connect a USB-TTL adapter (CP2102 / FT232)
   - Router TX → USB-TTL RX
   - Router RX → USB-TTL TX
   - Router GND → USB-TTL GND
   - **Do NOT connect VCC** (the device is self-powered)
4. Open a serial listener on the host
   ```bash
   sudo screen /dev/ttyUSB0 115200
   # or: minicom / picocom
   ```
5. Power on → watch U-Boot output → Linux boot → usually lands at a login prompt
6. Try default credentials / cracked shadow passwords → get a root shell

## Pitfall log

| Problem | Cause | Solution | Time spent |
|---------|-------|----------|------------|
| binwalk extracts an empty directory | Non-standard format in parts of the firmware (vendor-private header) | Slice manually with `dd` against offsets, or use `unblob` instead of binwalk | 1h |
| binwalk -E shows entropy near 1 | Firmware entirely encrypted | Find the decryption key used during firmware upgrade (usually hard-coded in the OEM tool) | hours |
| UART shows nothing | Wrong baud rate | Try 9600 / 38400 / 57600 / 115200 / 460800 / 921600 | 30min |
| UART shows garbage | TX/RX swapped / level mismatch | 1) swap TX and RX  2) confirm the USB-TTL is 3.3V, not 5V | 30min |
| Login prompt but no usable password | Cracking failed + vendor default changed | Interrupt at U-Boot → `setenv bootargs ${bootargs} init=/bin/sh` → single-user mode | 1.5h |
| U-Boot doesn't respond to keypress | Vendor disabled console / changed the prompt | Find `bootdelay` in the firmware; physically short the SPI flash pins to cause a boot failure so U-Boot drops to interactive | hours |
| Got root but telnetd doesn't work | No dropbear/telnetd in the image | Copy a busybox-static binary over via a mounted USB stick | 1h |

## Toolchain findings

- **unblob** beats binwalk (recognizes more formats, doesn't choke on private headers)
- **firmware-mod-kit** is old but still works for unpack/repack
- **firmwalker** automatically scans an extracted squashfs for "sensitive clues" (credentials/keys/URLs/binary backdoors)
- **EMBA** is a comprehensive firmware-audit platform (automated firmwalker + binary CVE scanning + emulation)
- **FirmAE** emulates IoT firmware under QEMU — analyze the web interface dynamically without real hardware
- **ChirpStack USB-TTL** / **Bus Pirate** / **Tigard** all work; a cheap CP2102 is fine too

## Key code/commands

Firmware audit pipeline:

```bash
# 1. Extract
unblob -k firmware.bin -o extracted/

# 2. Run firmwalker
git clone https://github.com/craigz28/firmwalker
./firmwalker.sh extracted/squashfs-root

# 3. Emulate (if supported)
docker run -it --rm -v $(pwd):/firmware firmae:latest \
  /work/run.sh -d 1 /firmware/firmware.bin

# 4. With the web interface emulated → scan it directly with nuclei / nikto / curl
```

Auto-try common UART baud rates:

```bash
for baud in 9600 19200 38400 57600 115200 460800 921600; do
    echo "--- $baud ---"
    timeout 3 sudo cat /dev/ttyUSB0 < <(stty -F /dev/ttyUSB0 $baud cs8 -cstopb -parenb)
done
```

Classic U-Boot single-user bypass:

```text
# Interrupt U-Boot by pressing a key (usually hold space or Ctrl+C)
=> setenv bootargs "console=ttyS0,115200 root=/dev/mtdblock2 rootfstype=squashfs init=/bin/sh"
=> saveenv
=> boot
# Boots straight into sh, no password needed
```

## Improvement suggestions for this package

- `reverse-engineering/platforms.md` already has a firmware section; suggest splitting out `references/iot-firmware-cheatsheet.md`
- Add `reverse-engineering/references/uart-debug.md` covering UART/JTAG/SWD fundamentals
- Add unblob / firmwalker to the bootstrap manifest

## Reusable patterns/script snippets

**IoT security testing, 4 phases**:

```text
Phase 1 — software
  · Download vendor firmware + extract with binwalk/unblob
  · Run firmwalker once
  · grep for default credentials / private keys / backdoor strings
  · Emulate with QEMU and run web vuln scans

Phase 2 — hardware
  · Open the case, find UART/JTAG pads
  · Identify GND/VCC/TX/RX with a multimeter
  · Wire up USB-TTL, confirm 3.3V levels

Phase 3 — debugging
  · Listen with screen/minicom
  · Interrupt at U-Boot for the interactive prompt
  · init=/bin/sh single-user password bypass

Phase 4 — exploitation
  · Root obtained → offline-crack /etc/shadow
  · Examine web admin CGI binaries → find command injection / SSRF
  · Examine UPnP / mDNS / Bluetooth broadcast logic
```

**Default credential quick reference** (common vendors):

```text
admin / admin
admin / password
root / root
root / 1234
support / support
ubnt / ubnt          # Ubiquiti
admin / 1234         # ZyXEL
```

## Evolution actions
- [ ] Split out iot-firmware-cheatsheet.md
- [ ] Create uart-debug.md
- [ ] Add unblob / firmwalker to the bootstrap-manifest

## Environment info
- Kali 2026.x (binwalk / unblob / squashfs-tools / firmwalker)
- USB-TTL adapter: CP2102 / FT232 (3.3V level)
- Target: ARMv7 / MIPS routers (OpenWRT-derived firmware is common)

## Anonymization requirements
This entry is seed data, written from public IoT security testing methodology; no real vendors or models involved.
