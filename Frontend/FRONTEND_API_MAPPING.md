# Frontend TODO -> Backend endpoint mapping

| Frontend | Replace TODO with |
|---|---|
| register.js | `POST /api/auth/register` |
| login.js | `POST /api/auth/login` |
| backpacks.js | `GET /api/products` |
| checkout.js | `POST /api/orders` |
| profile.js | `/api/profile` + `/api/profile/addresses` + `/api/profile/password` |
| seller.js | `POST /api/sellers` |
| help.js | `POST /api/support` |
| profile orders | `GET /api/orders/my` |

Add this to each page before its page-specific JS:
```html
<script src="api.js"></script>
```

The backend uses JWT. After login/signup:
```js
localStorage.setItem("kenova-token", data.token);
```
