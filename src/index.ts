import express, { Express, Request, Response } from "express";
import {
  getGraphForJson,
  getGraphForPackageName,
} from "./service/graphService";
import dotenv from "dotenv";
import { PackageJson } from "./service/types";

dotenv.config();
const app: Express = express();
const port = process.env.PORT || 3000;

type ReqParams = {
  name: string;
  version?: string;
};

app.use(express.json());

app.get(
  "/package",
  async (req: Request<{}, {}, {}, ReqParams>, res: Response) => {
    const data = await getGraphForPackageName({
      name: req.query.name,
      version: req.query.version,
    });
    res.send(data);
  }
);

app.post(
  "/package-json",
  async (req: Request<{}, {}, PackageJson, {}>, res: Response) => {
    const data = await getGraphForJson(req.body);
    res.send(data);
  }
);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
