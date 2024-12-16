import express, { Express, NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import { ls } from "./service/remote-ls.js";

dotenv.config();
const app: Express = express();
const port = process.env.PORT || 3000;

type ReqParams = {
  name: string;
  version?: string;
};

app.use(express.json());
app.use(async (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({
    status_code: err.status_code,
    message: err.message,
    error: err.error,
  });
});

app.get(
  "/package",
  async (req: Request<{}, {}, {}, ReqParams>, res: Response) => {
    const data = await ls(req.query.name, req.query.version ?? "latest");
    res.send(data);
  }
);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

export default app;
