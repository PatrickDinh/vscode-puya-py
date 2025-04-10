export const getDebugLspPort = () => {
  const port = Number(process.env.ALGORAND_LS_PORT)
  return !isNaN(port) && port > 0 ? port : undefined
}
