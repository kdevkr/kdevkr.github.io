---
title: MCP 서버 연동 오류와 실패
date: 2025-04-11T00:00+09:00
tags:
- Agentic AI
- Claude Desktop
- MCP Server
---

클로드 데스크탑(Claude Desktop)에 [MCP 서버들을 연결해보면서](https://modelcontextprotocol.io/quickstart/user) 경험했던 오류와 해결 방법에 대해서 공유하려고 합니다. 서로 다른 컴퓨터 환경으로 인해 생각보다 많은 사람들이 `의도치않게 삽질`을 하고 있는 것 같습니다. 아직은 MCP 서버들이 완성도 있게 작성되는 상태는 아니므로 `오류와 실패에 대한 경험이 더 중요`하지 않을까 싶습니다.

#### 운영체제별 노드 및 파이썬 패키지 매니저로 인한 오류

```sh
command not found: /Users/username/Desktop
```

앤트로픽이 기본적으로 제공하는 [Filesystem MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem)는 [TypeScript MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk)로 작성된 가장 기본적인 MCP 서버입니다. 하지만, 노드를 nvm 과 같은 패키지 관리 도구로 설치했다면 [올바르게 실행되지 않는](https://github.com/modelcontextprotocol/servers/issues/64) 상황을 만날 수 있습니다. 이 문제가 발생한 경우 클로드 데스크탑이 바라보는 `npx 의 전체 경로를 명시하는게 해결책`이지만 [servers#64 이슈의 댓글](https://github.com/modelcontextprotocol/servers/issues/64#issuecomment-2730913259)처럼 클로드 데스크탑을 위한 쉘 스크립트를 만들어서 사용해도 됩니다.

```sh
$ sudo vi /usr/local/bin/npx-for-claude

---
#!/usr/bin/env bash
export PATH="/Users/username/.nvm/versions/node/v22.14.0/bin:$PATH"
exec npx "$@"
---

$ sudo chmod +x /usr/local/bin/npx-for-claude
```

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx-for-claude",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/username/Desktop"
      ]
    }
  }
}
```

```sh spawn uvx ENOENT
2025-04-09T04:55:27.164Z [time] [info] Initializing server...
2025-04-09T04:55:27.186Z [time] [error] spawn uvx ENOENT {"context":"connection","stack":"Error: spawn uvx ENOENT\n    at ChildProcess._handle.onexit (node:internal/child_process:285:19)\n    at onErrorNT (node:internal/child_process:483:16)\n    at process.processTicksAndRejections (node:internal/process/task_queues:82:21)"}
2025-04-09T04:55:27.187Z [time] [error] spawn uvx ENOENT {"stack":"Error: spawn uvx ENOENT\n    at ChildProcess._handle.onexit (node:internal/child_process:285:19)\n    at onErrorNT (node:internal/child_process:483:16)\n    at process.processTicksAndRejections (node:internal/process/task_queues:82:21)"}
2025-04-09T04:55:27.188Z [time] [info] Server transport closed
2025-04-09T04:55:27.188Z [time] [info] Client transport closed
2025-04-09T04:55:27.189Z [time] [info] Server transport closed unexpectedly, this is likely due to the process exiting early. If you are developing this MCP server you can add output to stderr (i.e. `console.error('...')` in JavaScript, `print('...', file=sys.stderr)` in python) and it will appear in this log.
2025-04-09T04:55:27.189Z [time] [error] Server disconnected. For troubleshooting guidance, please visit our [debugging documentation](https://modelcontextprotocol.io/docs/tools/debugging) {"context":"connection"}
```

[Python MCP SDK](https://github.com/modelcontextprotocol/python-sdk)로 작성되는 MCP 서버들을 맥 환경에서 uvx 로 실행하기 위해 [uv 를 설치한 경우](https://docs.astral.sh/uv/getting-started/installation/#standalone-installer)에도 동일합니다. 쉘 스크립트 기반으로 설치하는 경우 /usr/.local/bin 경로에 설치되는데 클로드 데스크탑에서 사용되는 경로가 아닙니다. 이 경우에도 전체 경로를 명시하거나 [Homebrew로 설치](https://formulae.brew.sh/formula/uv)하면 클로드 데스크탑이 바라보는 경로에 제대로 설치됩니다.

#### Google Drive MCP 에서 도커 컨테이너로 인증할 수 없는 문제

[servers#1289](https://github.com/modelcontextprotocol/servers/issues/1289#issuecomment-2791542260) 이슈와 같이 Google Drive MCP 서버를 사용하기 위해 구글 OAuth2 사용자 정보를 통해 크레덴셜을 발급하려고 할때 [@google-cloud/local-auth](https://github.com/googleapis/nodejs-local-auth/blob/main/src/index.ts#L115-L121)에서 랜덤 포트로 실행되어 [README에 기재된 내용](https://github.com/modelcontextprotocol/servers/tree/main/src/gdrive#docker)과 다르게 인증 결과가 정상적으로 리다이렉트될 수 없는 문제가 있습니다.

OAuth 클라이언트 아이디를 만들때 Desktop App 유형으로 만들면 installed 를 키로 가지는 JSON 파일을 다운로드하게 됩니다. 따라서, 가이드에 기재된 명령어대로 3000 포트로 수신하기 위해서는 web 으로 변경하고 실행해야합니다.

```json
{
  "web": {
    "client_id": "YOUR_CLIENT_ID",
    "project_id": "YOUR_PROJECT_ID",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "YOUR_CLIENT_SECRET",
    "redirect_uris": ["http://localhost"]
  }
}
```

#### Redis MCP가 커서 앱에서 열리는 문제

윈도우 환경에서 클로드 데스크탑이 Redis MCP Server를 실행했을 때 index.js 파일이 커서 앱으로 실행되는 증상을 경험했습니다. Redis MCP 서버 설정은 다음과 같이 별다른 부분이 없는 상태입니다.

```json
{
  "mcpServers": {
    "redis": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-redis", "redis://localhost:6379"]
    }
}
```

```sh
2025-04-10T12:45:00.248Z [redis] [info] Initializing server...
2025-04-10T12:45:00.487Z [redis] [info] Server started and connected successfully
2025-04-10T12:45:00.604Z [redis] [info] Message from client: {"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"claude-ai","version":"0.1.0"}},"jsonrpc":"2.0","id":0}
2025-04-10T12:45:43.369Z [redis] [info] Server transport closed
2025-04-10T12:45:43.369Z [redis] [info] Client transport closed
2025-04-10T12:45:43.369Z [redis] [info] Server transport closed unexpectedly, this is likely due to the process exiting early. If you are developing this MCP server you can add output to stderr (i.e. `console.error('...')` in JavaScript, `print('...', file=sys.stderr)` in python) and it will appear in this log.
2025-04-10T12:45:43.370Z [redis] [error] Server disconnected. For troubleshooting guidance, please visit our [debugging documentation](https://modelcontextprotocol.io/docs/tools/debugging) {"context":"connection"}
2025-04-10T12:45:43.371Z [redis] [info] Client transport closed
```

앤트로픽이 제공한 MCP 대신에 [GongRzhe/REDIS-MCP-Server](https://github.com/GongRzhe/REDIS-MCP-Server)를 사용했을때는 발생하지 않았는데 타입스크립트 SDK로 작성된 다른 MCP 서버들을 살펴본 결과, [노드에 대한 Shebang이 생략되어 있습니다](https://github.com/modelcontextprotocol/servers/issues/1355)만 이것이 원인일지는 잘 모르겠으나 이슈로 등록해놓은 상태입니다.

#### Redis MCP 에서 비밀번호 인증이 필요한 경우

Redis MCP Server의 [README](https://github.com/modelcontextprotocol/servers/blob/main/src/redis/README.md#npx) 파일에는 로컬에 실행한 레디스에 연결하는 예시로 안내해주고 있습니다. 만약, requirepass 옵션이 적용된 레디스에 연결하려면 [URL에 비밀번호가 포함된 형태](https://github.com/redis/lettuce/wiki/Redis-URI-and-connection-details#uri-syntax)로 설정해야합니다.

```sh
docker run --name redis -d -p 6379:6379 redis redis-server --requirepass 1234
```

```json
{
  "mcpServers": {
    "redis": {
      "command": "npx",
      "args": ["-y", "@gongrzhe/server-redis-mcp@1.0.0", "redis://:1234@localhost:6379"]
    }
  }
}
```

#### Github MCP 에서 조직 리파지토리 권한이 없음

[github-mcp-server#153](https://github.com/github/github-mcp-server/issues/153)처럼 Github MCP 서버를 위한 액세스 토큰을 발급할 때 `Fine-grained PAT` 로 발급하면 조직 계정의 리파지토리를 조회할 수 있는 권한이 없는 문제가 있습니다. 따라서, 클래식(classic) 토큰으로 발급받아서 사용하는 것을 권장합니다.

#### Time MCP: No time zone found with key KST

```sh
Traceback (most recent call last):
  File "/Users/username/Library/Application Support/uv/python/cpython-3.12.9-macos-aarch64-none/lib/python3.12/zoneinfo/_common.py", line 12, in load_tzdata
    return resources.files(package_name).joinpath(resource_name).open("rb")
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/username/Library/Application Support/uv/python/cpython-3.12.9-macos-aarch64-none/lib/python3.12/pathlib.py", line 1013, in open
    return io.open(self, mode, buffering, encoding, errors, newline)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
FileNotFoundError: [Errno 2] No such file or directory: '/Users/username/.cache/uv/archive-v0/S2oZOdPKchj5YFK67-25o/lib/python3.12/site-packages/tzdata/zoneinfo/KST'

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/Users/username/.cache/uv/archive-v0/S2oZOdPKchj5YFK67-25o/bin/mcp-server-time", line 12, in <module>
    sys.exit(main())
             ^^^^^^
  File "/Users/username/.cache/uv/archive-v0/S2oZOdPKchj5YFK67-25o/lib/python3.12/site-packages/mcp_server_time/__init__.py", line 15, in main
    asyncio.run(serve(args.local_timezone))
  File "/Users/username/Library/Application Support/uv/python/cpython-3.12.9-macos-aarch64-none/lib/python3.12/asyncio/runners.py", line 195, in run
    return runner.run(main)
           ^^^^^^^^^^^^^^^^
  File "/Users/username/Library/Application Support/uv/python/cpython-3.12.9-macos-aarch64-none/lib/python3.12/asyncio/runners.py", line 118, in run
    return self._loop.run_until_complete(task)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/username/Library/Application Support/uv/python/cpython-3.12.9-macos-aarch64-none/lib/python3.12/asyncio/base_events.py", line 691, in run_until_complete
    return future.result()
           ^^^^^^^^^^^^^^^
  File "/Users/username/.cache/uv/archive-v0/S2oZOdPKchj5YFK67-25o/lib/python3.12/site-packages/mcp_server_time/server.py", line 119, in serve
    local_tz = str(get_local_tz(local_timezone))
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/username/.cache/uv/archive-v0/S2oZOdPKchj5YFK67-25o/lib/python3.12/site-packages/mcp_server_time/server.py", line 45, in get_local_tz
    return ZoneInfo(str(tzinfo))
           ^^^^^^^^^^^^^^^^^^^^^
  File "/Users/username/Library/Application Support/uv/python/cpython-3.12.9-macos-aarch64-none/lib/python3.12/zoneinfo/_common.py", line 24, in load_tzdata
    raise ZoneInfoNotFoundError(f"No time zone found with key {key}")
zoneinfo._common.ZoneInfoNotFoundError: 'No time zone found with key KST'
2025-04-10T02:15:25.495Z [time] [info] Server transport closed
2025-04-10T02:15:25.495Z [time] [info] Client transport closed
2025-04-10T02:15:25.495Z [time] [info] Server transport closed unexpectedly, this is likely due to the process exiting early. If you are developing this MCP server you can add output to stderr (i.e. `console.error('...')` in JavaScript, `print('...', file=sys.stderr)` in python) and it will appear in this log.
2025-04-10T02:15:25.495Z [time] [error] Server disconnected. For troubleshooting guidance, please visit our [debugging documentation](https://modelcontextprotocol.io/docs/tools/debugging) {"context":"connection"}
```

[Time MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/time)를 설정할 때 타임존 옵션을 지정하지 않으면 자동으로 `시스템 타임존`을 사용합니다. 하지만, IANA 타임존 표기가 아닌 경우 위와 같은 오류가 발생하기 때문에 가이드 문서에서는 선택 옵션이지만 `--local-timezone 옵션을 지정`하는 것을 권장하는 바입니다.

```json
{
  "mcpServers": {
    "time": {
      "command": "uvx",
      "args": ["mcp-server-time", "--local-timezone=Asia/Seoul"]
    }
  }
}
```

MCP 서버 설정 시 고생하는 많은 분들에게 도움이 되길 바랍니다. 감사합니다.
