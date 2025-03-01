import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

// SDK Mercado Pago
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Agrega credenciales
const client = new MercadoPagoConfig({
    accessToken: process.env.REACT_APP_MERCADOPAGO_API_KEY,
});

const app = express();
const port = 4000;

// Configurar CORS: se permite el envío de credenciales (cookies) desde el origin "https://planifiklub.vercel.app"
app.use(cors({
    origin: 'https://planifiklub.vercel.app',
    credentials: true
}));

app.use(express.json());

// Middleware para interceptar y modificar la cabecera "Set-Cookie"
// Se revisa si la cookie contiene "_mp_esc_" y se reemplaza SameSite=Lax o Strict por SameSite=None y se agrega Secure
app.use((req, res, next) => {
  const originalSetHeader = res.setHeader.bind(res);
  res.setHeader = (name, value, ...args) => {
    if (name.toLowerCase() === 'set-cookie') {
      if (Array.isArray(value)) {
        value = value.map(cookie => {
          if (cookie.includes('_mp_esc_')) {
            cookie = cookie.replace(/; ?SameSite=(Lax|Strict)/i, '; SameSite=None; Secure');
          }
          return cookie;
        });
      } else if (typeof value === 'string' && value.includes('_mp_esc_')) {
        value = value.replace(/; ?SameSite=(Lax|Strict)/i, '; SameSite=None; Secure');
      }
    }
    originalSetHeader(name, value, ...args);
  };
  next();
});

app.get("/", (req, res) => {
    res.send("Server funciona");
});

app.post("/create_preference", async (req, res) => {
    try {
        const body = {
            items : [
                {
                    title: req.body.title,
                    quantity: Number(req.body.quantity),
                    unit_price: Number(req.body.price),
                    currency_id: "COP"
                },
            ],
        };

        const preference = new Preference(client);
        const result = await preference.create({ body });
        res.json({
            id: result.id,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Error al crear la preferencia"
        });
    }
});

app.listen(port, () => {
    console.log("El server de Mercado Pago inició correctamente en el puerto", port);
});
