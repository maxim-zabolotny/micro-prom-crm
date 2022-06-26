# Proxy Server

--- 
Sources: 
- [https://phoenixnap.com/kb/setup-install-squid-proxy-server-ubuntu](https://phoenixnap.com/kb/setup-install-squid-proxy-server-ubuntu)

---
Requirements for **raspberry pi**:
- `ip` - 192.168.3.202
- `protocol` - HTTP

Actual config for **Squid** proxy server:
```shell
http_port 1234 transparent
http_access allow all
visible_hostname pi_local_proxy
```

---
Useful commands for **Squid**: 
```shell
sudo systemctl status squid  # check the status of your Squid software

sudo systemctl start squid   # start the service 

sudo systemctl stop squid    # stop the service

sudo systemctl enable squid  # set the Squid service to launch when the system starts

sudo systemctl disable squid # prevent Squid from launching at startup
```