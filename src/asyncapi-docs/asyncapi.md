# Chat WebSocket API 1.0.0 documentation

* License: [MIT](https://opensource.org/licenses/MIT)
* Email support: [support@example.com](mailto:support@example.com)

Real-time chat communication protocol via WebSocket.

## Connection Flow:
1. Client connects to WebSocket endpoint
2. Sends INIT message with username
3. Receives initial data (users list, history)
4. Exchanges real-time messages


## Table of Contents

* [Servers](#servers)
  * [development](#development-server)
  * [production](#production-server)
* [Operations](#operations)
  * [PUB /](#pub--operation)
  * [SUB /](#sub--operation)

## Servers

### `development` Server

* URL: `ws://localhost:3001`
* Protocol: `ws`

Development server


### `production` Server

* URL: `wss://api.example.com/chat`
* Protocol: `wss`

Production server


## Operations

### PUB `/` Operation

Primary WebSocket channel for all chat communications

Accepts **one of** the following messages:

#### Message `initMessage`

*Initial authentication message*

First message sent by client to establish connection

##### Payload

| Name | Type | Description | Value | Constraints | Notes |
|---|---|---|---|---|---|
| (root) | object | - | - | - | **additional properties are allowed** |
| type | string | - | allowed (`"init"`) | - | **required** |
| username | string | - | - | [ 3 .. 20 ] characters | **required** |
| id | string | - | - | pattern (`^[a-zA-Z0-9-]+$`) | **required** |

> Examples of payload _(generated)_

```json
{
  "type": "init",
  "username": "alice123",
  "id": "client-98765"
}
```


#### Message `textMessage`

*Text chat message*

Standard text message from client

##### Payload

| Name | Type | Description | Value | Constraints | Notes |
|---|---|---|---|---|---|
| (root) | object | - | - | - | **additional properties are allowed** |
| type | string | - | allowed (`"text"`) | - | **required** |
| text | string | - | - | [ 1 .. 1000 ] characters | **required** |

> Examples of payload _(generated)_

```json
{
  "type": "text",
  "text": "Hello everyone!"
}
```


#### Message `fileMessage`

*File attachment message*

Message containing file data

##### Payload

| Name | Type | Description | Value | Constraints | Notes |
|---|---|---|---|---|---|
| (root) | object | - | - | - | **additional properties are allowed** |
| type | string | - | allowed (`"file"`) | - | **required** |
| file | object | - | - | - | **required**, **additional properties are allowed** |
| file.name | string | - | - | - | **required** |
| file.type | string | - | - | - | **required** |
| file.size | integer | - | - | >= 1 | **required** |
| file.data | string | - | - | format (`byte`) | **required** |

> Examples of payload _(generated)_

```json
{
  "type": "file",
  "file": {
    "name": "document.pdf",
    "type": "application/pdf",
    "size": 24576,
    "data": "base64encodedstring"
  }
}
```



### SUB `/` Operation

Primary WebSocket channel for all chat communications

Accepts **one of** the following messages:

#### Message `serverMessage`

*Standard server message*

Regular message from server to client

##### Payload

| Name | Type | Description | Value | Constraints | Notes |
|---|---|---|---|---|---|
| (root) | object | - | - | - | **additional properties are allowed** |
| type | string | - | allowed (`"message"`) | - | **required** |
| id | string | - | - | - | **required** |
| sender | string | - | - | - | **required** |
| content | string | - | - | - | **required** |
| timestamp | integer | - | - | - | **required** |

> Examples of payload _(generated)_

```json
{
  "type": "message",
  "id": "string",
  "sender": "string",
  "content": "string",
  "timestamp": 0
}
```


#### Message `errorMessage`

*Error notification*

Error response from server

##### Payload

| Name | Type | Description | Value | Constraints | Notes |
|---|---|---|---|---|---|
| (root) | object | - | - | - | **additional properties are allowed** |
| type | string | - | allowed (`"error"`) | - | **required** |
| code | string | - | - | - | **required** |
| message | string | - | - | - | **required** |

> Examples of payload _(generated)_

```json
{
  "type": "error",
  "code": "string",
  "message": "string"
}
```


#### Message `userDataMessage`

*User list update*

Current list of all connected users

##### Payload

| Name | Type | Description | Value | Constraints | Notes |
|---|---|---|---|---|---|
| (root) | object | - | - | - | **additional properties are allowed** |
| type | string | - | allowed (`"userData"`) | - | **required** |
| users | array&lt;object&gt; | - | - | - | **required** |
| users.id | string | - | - | - | **required** |
| users.username | string | - | - | - | **required** |
| users.online | boolean | - | - | - | **required** |
| users.lastActive | integer | - | - | - | - |

> Examples of payload _(generated)_

```json
{
  "type": "userData",
  "users": [
    {
      "id": "string",
      "username": "string",
      "online": true,
      "lastActive": 0
    }
  ]
}
```


#### Message `userStatusMessage`

*User status change*

Notification about user going online/offline

##### Payload

| Name | Type | Description | Value | Constraints | Notes |
|---|---|---|---|---|---|
| (root) | object | - | - | - | **additional properties are allowed** |
| type | string | - | allowed (`"userStatus"`) | - | **required** |
| userId | string | - | - | - | **required** |
| username | string | - | - | - | **required** |
| online | boolean | - | - | - | **required** |

> Examples of payload _(generated)_

```json
{
  "type": "userStatus",
  "userId": "string",
  "username": "string",
  "online": true
}
```


#### Message `historyMessage`

*Message history*

Recent messages sent on connection

##### Payload

| Name | Type | Description | Value | Constraints | Notes |
|---|---|---|---|---|---|
| (root) | object | - | - | - | **additional properties are allowed** |
| type | string | - | allowed (`"history"`) | - | **required** |
| messages | array&lt;object&gt; | - | - | - | **required** |
| messages.type | string | - | allowed (`"message"`) | - | **required** |
| messages.id | string | - | - | - | **required** |
| messages.sender | string | - | - | - | **required** |
| messages.content | string | - | - | - | **required** |
| messages.timestamp | integer | - | - | - | **required** |

> Examples of payload _(generated)_

```json
{
  "type": "history",
  "messages": [
    {
      "type": "message",
      "id": "string",
      "sender": "string",
      "content": "string",
      "timestamp": 0
    }
  ]
}
```



