# Debug Interface Triage

1. Look for silkscreen markings: TX RX GND VCC TDI TDO TCK TMS  
2. Match voltages before connecting  
3. Start with read-only serial logs  
4. Record the U-Boot interrupt key and environment variables (do not casually run saveenv)  
5. SHA256 the image after extraction