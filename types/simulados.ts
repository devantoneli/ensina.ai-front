export interface Simulado {
  id: string;
  titulo: string;
  descricao: string;
  nivel: 'Fácil' | 'Médio' | 'Difícil';
  questoes: number;
  tempoEstimado: number; // em minutos
  materia: string;
  imagem?: string;
  feito?: boolean;
}

export interface SimuladoResponse {
  simulados: Simulado[];
}
