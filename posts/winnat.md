---
title: listen EACCES
date: 2025-06-27T21:00+09:00
tags:
- winnat
---

```powershell
PS C:\Users\Mambo\git\kdevkr.github.io> pnpm run l

> kdevkr.github.io@1.0.0 l C:\Users\Mambo\git\kdevkr.github.io
> cross-env NODE_ENV=development hexo server

INFO  Validating config
INFO  ==================================
  ███╗   ██╗███████╗██╗  ██╗████████╗
  ████╗  ██║██╔════╝╚██╗██╔╝╚══██╔══╝
  ██╔██╗ ██║█████╗   ╚███╔╝    ██║
  ██║╚██╗██║██╔══╝   ██╔██╗    ██║
  ██║ ╚████║███████╗██╔╝ ██╗   ██║
  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝   ╚═╝
========================================
NexT version 8.22.0
Documentation: https://theme-next.js.org
========================================
node:events:496
      throw er; // Unhandled 'error' event
      ^

Error: listen EACCES: permission denied 0.0.0.0:14000
    at Server.setupListenHandle [as _listen2] (node:net:1915:21)
    at listenInCluster (node:net:1994:12)
    at Server.listen (node:net:2099:7)
    at module.exports.plugin (C:\Users\Mambo\git\kdevkr.github.io\node_modules\.pnpm\browser-sync@2.29.3\node_modules\browser-sync\dist\server\index.js:27:25)
    at Object.startServer [as fn] (C:\Users\Mambo\git\kdevkr.github.io\node_modules\.pnpm\browser-sync@2.29.3\node_modules\browser-sync\dist\async.js:180:52)
    at C:\Users\Mambo\git\kdevkr.github.io\node_modules\.pnpm\browser-sync@2.29.3\node_modules\browser-sync\dist\browser-sync.js:121:14
    at iterate (C:\Users\Mambo\git\kdevkr.github.io\node_modules\.pnpm\browser-sync@2.29.3\node_modules\browser-sync\dist\utils.js:269:9)
    at C:\Users\Mambo\git\kdevkr.github.io\node_modules\.pnpm\browser-sync@2.29.3\node_modules\browser-sync\dist\utils.j    at executeTask (C:\Users\Mambo\git\kdevkr.github.io\node_modules\.pnpm\browser-sync@2.29.3\node_modules\browser-sync\dist\browser-sync.js:137:13)
    at Object.mergeMiddlewares [as fn] (C:\Users\Mambo\git\kdevkr.github.io\node_modules\.pnpm\browser-sync@2.29.3\node_modules\browser-sync\dist\async.js:169:9)
-sync.js:121:14
    at iterate (C:\Users\Mambo\git\kdevkr.github.io\node_modules\.pnpm\browser-sync@2.29.3\node_modules\browser-sync\dist\utils.js:269:9)
    at C:\Users\Mambo\git\kdevkr.github.io\node_modules\.pnpm\browser-sync@2.29.3\node_modules\browser-sync\dist\utils.js:280:21
    at executeTask (C:\Users\Mambo\git\kdevkr.github.io\node_modules\.pnpm\browser-sync@2.29.3\node_modules\browser-sync\dist\browser-sync.js:137:13)
    at Object.setFileWatchers [as fn] (C:\Users\Mambo\git\kdevkr.github.io\node_modules\.pnpm\browser-sync@2.29.3\node_modules\browser-sync\dist\async.js:158:9)
    at C:\Users\Mambo\git\kdevkr.github.io\node_modules\.pnpm\browser-sync@2.29.3\node_modules\browser-sync\dist\browser-sync.js:121:14
Emitted 'error' event on Server instance at:
    at emitErrorNT (node:net:1973:8)
    at process.processTicksAndRejections (node:internal/process/task_queues:90:21) {
  code: 'EACCES',
  errno: -4092,
  syscall: 'listen',
  address: '0.0.0.0',
  port: 14000
}
```

개인 PC를 재부팅 하고나서 블로그 작성을 위해 pnpm run 명령어를 실행하니 browsersync 에 대한 서버가 실행되지 않았다. 윈도우에서 이 오류 메시지를 만난다면 Windows NAT 서비스가 일반적으로 사용되지 않을 포트 범위를 기본적으로 차단해놓을 수 있다. 워낙 유명한 것이라서 다음과 같이 [Windows NAT 서비스를 다시 실행해주면](https://stackoverflow.com/questions/9164915/node-js-eacces-error-when-listening-on-most-ports) 해결된다.

```powershell
PS C:\Users\Mambo> net stop winnat

Windows NAT Driver 서비스를 잘 멈추었습니다.

PS C:\Users\Mambo> net start winnat

Windows NAT Driver 서비스가 잘 시작되었습니다.
```

> 🔥 윈도우 터미널에서 새 탭으로 열기를 하면서 컨트롤과 함께 Powershell 또는 명령 프롬프트를 선택하면 관리자 권한으로 실행할 수 있다.