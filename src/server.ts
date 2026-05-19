import { buildApp } from "./app.js";

const app = buildApp();

app.listen(3001, () => {
    console.log('Server running on http://localhost:3001');
})
