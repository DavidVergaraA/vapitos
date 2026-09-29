import { useCallback, useEffect, useState } from 'react'
import {
  obtenerGarantias, obtenerInventarioDefectuoso, obtenerInventarioDisponible,
  obtenerVentasParaGarantia, registrarGarantia, registrarReventaGarantia, actualizarDestinoGarantia,
} from '../services/garantiasService'

export function useGarantias(){
  const [ventas,setVentas]=useState([]); const [disponibles,setDisponibles]=useState([]); const [defectuosos,setDefectuosos]=useState([]); const [garantias,setGarantias]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(null)
  const cargar=useCallback(async()=>{try{setLoading(true);setError(null);const [v,d,x,g]=await Promise.all([obtenerVentasParaGarantia(),obtenerInventarioDisponible(),obtenerInventarioDefectuoso(),obtenerGarantias()]);setVentas(v);setDisponibles(d);setDefectuosos(x);setGarantias(g)}catch(e){setError(e)}finally{setLoading(false)}},[])
  useEffect(()=>{cargar()},[cargar])
  const ejecutar=async(fn)=>{try{setError(null);await fn();await cargar()}catch(e){setError(e);throw e}}
  return {ventas,inventarioDisponible:disponibles,inventarioDefectuoso:defectuosos,garantias,loading,error,recargar:cargar,crearGarantia:g=>ejecutar(()=>registrarGarantia(g)),actualizarDestino:g=>ejecutar(()=>actualizarDestinoGarantia(g)),registrarReventa:g=>ejecutar(()=>registrarReventaGarantia(g))}
}
