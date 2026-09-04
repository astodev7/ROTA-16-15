import bcrypt from "bcryptjs";

const senha = "senha";

const hash = "senhahash";

const resultado = await bcrypt.compare(senha, hash);

console.log(resultado);
