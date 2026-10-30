# Chuyen tiep /api toi backend; duoc include trong cac location cua nginx.conf (gioi han tan suat khac nhau)
proxy_pass http://backend:8080;
proxy_http_version 1.1;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;
proxy_read_timeout 60s;
