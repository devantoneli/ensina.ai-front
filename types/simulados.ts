export interface Simulado {
  id: string;
  titulo: string;
  descricao: string;
  nivel: 'Fácil' | 'Médio' | 'Difícil';
  questoes: number;
  tempoEstimado: number; // em minutos
  categoria: string;
  imagem?: string;
}

export interface SimuladoResponse {
  simulados: Simulado[];
}
