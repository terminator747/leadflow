Write-Host "Checking MongoDB Atlas DNS..."
Write-Host ""
nslookup -type=SRV _mongodb._tcp.cluster0.fxblzjz.mongodb.net
Write-Host ""
Write-Host "If this returns SERVFAIL/REFUSED/timeouts, your Windows DNS/VPN/firewall is blocking the Atlas SRV lookup."
Write-Host "Try disconnecting VPN, changing adapter DNS to 1.1.1.1 or 8.8.8.8, then run this again."
