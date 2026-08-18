/**
 * Carrega variáveis de ambiente para scripts fora do Next.
 * O Next lê .env.local nativamente; o dotenv puro só lê .env.
 *
 * Precisa ser um import com efeito colateral (import "./load-env"), porque
 * imports são içados e rodam antes de qualquer chamada de função no módulo.
 */
import { config } from "dotenv";

config({ path: [".env.local", ".env"], quiet: true });