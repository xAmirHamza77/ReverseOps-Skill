# OT Security Assessment Safety Checklist

1. Authorization scope and emergency contacts  
2. Whether active probing / write operations are allowed (default: no)  
3. Maintenance windows and rollback plan  
4. Traffic mirroring takes priority over port scanning  
5. Stop immediately and notify upon finding anything high-risk  
6. In the report, distinguish: remotely exploitable vs. requiring physical access  

Common protocol ports (for identification only, not an exploitation manual): Modbus/TCP 502, S7comm 102, EtherNet/IP 44818, DNP3 20000.