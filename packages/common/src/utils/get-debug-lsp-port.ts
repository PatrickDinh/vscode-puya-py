export const getDebugLspPort = () => {
  const port = Number(process.env.ALGORAND_LSP_PORT)
  return !isNaN(port) && port > 0 ? port : undefined
}
