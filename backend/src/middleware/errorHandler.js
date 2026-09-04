function notFound(req, res) {
  res.status(404).json({ message: "Rota não encontrada." });
}

function errorHandler(err, req, res, next) {
  console.error(err);
  const status = Number(err?.status) || (err?.code === "P0001" ? 409 : 500);
  const safeMessage = status >= 500 ? "Erro interno no servidor." : (err?.message || "Não foi possível concluir a operação.");
  res.status(status).json({ message: safeMessage });
}

export { notFound, errorHandler };
