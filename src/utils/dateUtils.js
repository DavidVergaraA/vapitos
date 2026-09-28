const ZONA_NEGOCIO = 'America/Bogota'

export function obtenerFechaColombia() {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_NEGOCIO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const valores = Object.fromEntries(
    partes
      .filter((parte) => parte.type !== 'literal')
      .map((parte) => [parte.type, parte.value])
  )

  return `${valores.year}-${valores.month}-${valores.day}`
}

export function obtenerInicioSemana(fechaString = obtenerFechaColombia()) {
  const fecha = new Date(`${fechaString}T12:00:00-05:00`)
  const dia = fecha.getUTCDay()
  const diferencia = dia === 0 ? -6 : 1 - dia
  fecha.setUTCDate(fecha.getUTCDate() + diferencia)
  return fecha.toISOString().slice(0, 10)
}

export function sumarDias(fechaString, dias) {
  const fecha = new Date(`${fechaString}T12:00:00-05:00`)
  fecha.setUTCDate(fecha.getUTCDate() + dias)
  return fecha.toISOString().slice(0, 10)
}

export function obtenerFinSemana(fechaString = obtenerFechaColombia()) {
  return sumarDias(obtenerInicioSemana(fechaString), 6)
}

export function esDomingo(fechaString = obtenerFechaColombia()) {
  const fecha = new Date(`${fechaString}T12:00:00-05:00`)
  return fecha.getUTCDay() === 0
}

export function semanaCompleta(fechaInicio, fechaFin, hoy = obtenerFechaColombia()) {
  return fechaFin < hoy
}

export function formatearRangoSemana(fechaInicio, fechaFin) {
  const formato = new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    timeZone: ZONA_NEGOCIO,
  })

  const inicio = formato.format(new Date(`${fechaInicio}T12:00:00-05:00`))
  const fin = formato.format(new Date(`${fechaFin}T12:00:00-05:00`))

  return `${inicio} — ${fin}`
}
