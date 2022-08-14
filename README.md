<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456

[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## APIs

### login

POST http://127.0.0.1:4000/auth/login
BODY: {
"username": "john",
"password": "changeme"
}
RESPONSE: {access-token : "token"}

## EKS

### aliases

|               Action               |                                                                   Command                                                                   |         Comments         |
|:----------------------------------:|:-------------------------------------------------------------------------------------------------------------------------------------------:|:------------------------:|
|      Get webrtc pods: getpods      |                                  <code>alias getpods='kubectl get pods -A &#124; grep webrtc'  </code>                                  | getpods |
|   Get webrtc deploymets: getpods   |                                               <code>alias getpods='kubectl get deployments -A &#124; grep webrtc'  </code>   | getdeplos|
|    Describe deployment: ddploy     |                                <code>alias ddploy='kubectl describe deployment -n webrtc'           </code>                                 | ddploy  [deployment id]  |
| Delete webrtc gateway pods: delrtc |                 <code>alias delrtc='kubectl delete pod -n webrtc --selector=app.kubernetes.io/name=webrtc-gateway' </code>                  | delrtc =>       all pods |
|         Describe pod: dpod         |                           <code>dpod='kubectl describe pod -n mvnr-mtcil1-appln-ngn-mcu'                  </code>                           |      dpod [pod id]       |
|        Webrtc logs: rtclogs        | <code> alias rtclogs='kubectl logs -n webrtc --selector=app.kubernetes.io/name=webrtc-gateway -c webrtc-gateway -f --tail 100 2>&1' </code> |      rtclogs &#124; grep error |
|         Scale 1: scalertc          |                        <code>alias scalertc='kubectl scale deployment -n webrtc webrtc-gateway --replicas=1'</code>                         |         scalertc                 |

## License

Nest is [MIT licensed](LICENSE).
