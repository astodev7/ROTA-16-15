import bcrypt from "bcryptjs";

const senha = "RoTaadMin08191@gpj#";

const hash = "$2b$12$ERrTeqKTb6Vh/5U7xmpbouD7g/90idv0NjRMDBPD6.RCcm4dNoJQu";

const resultado = await bcrypt.compare(senha, hash);

console.log(resultado);