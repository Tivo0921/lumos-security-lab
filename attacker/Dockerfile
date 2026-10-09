FROM alpine:3.20
# XSS演習で使う最小限のツール群
#   curl   : victim へのリクエスト確認 / payload投入
#   python3: cookie を受け取る簡易サーバ (catcher) 用
#   bind-tools, bash: 疎通確認・操作用
RUN apk add --no-cache curl python3 bash bind-tools
WORKDIR /root
COPY catcher.py ./
RUN printf '%s\n' \
  "Lumos Security Lab - attacker box" \
  "victim は http://victim:3000 で到達できます (例: curl http://victim:3000/)" \
  "cookie catcher: python3 catcher.py  (8000番で待ち受け)" \
  > /etc/motd
CMD ["bash"]
