import app from "./src/app";

// Hosts like Render/Fly/Railway inject a PORT to bind to; fall back to 3000 locally.
const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
