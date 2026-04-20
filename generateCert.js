import selfsigned from "selfsigned";
import fs from "fs";

if (!fs.existsSync("key.pem") || !fs.existsSync("cert.pem")) {

    const attrs = [{ name: "commonName", value: "localhost" }];

    const pems = await selfsigned.generate(attrs, {
        days: 365,
        keySize: 2048,
    });

    fs.writeFileSync("key.pem", pems.private);
    fs.writeFileSync("cert.pem", pems.cert);

}