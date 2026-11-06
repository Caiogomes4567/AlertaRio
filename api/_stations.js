// Cadastro das estações e limites (cm de NÍVEL DA ÁGUA acima do fundo).
// Mantenha os limites iguais aos do firmware (ATENCAO_CM / CRITICO_CM).
module.exports = [
  { id: 'AR-01', nome: 'Canal do Pinheirinho',    local: 'Vila Nova',     atencao: 180, critico: 240 },
  { id: 'AR-02', nome: 'Córrego da Rua 12',       local: 'Jardim Aurora', atencao: 150, critico: 200 },
  { id: 'AR-03', nome: 'Bueiro da Praça Central', local: 'Centro',        atencao: 90,  critico: 120 },
  // AR-04: limites ainda não definidos no site; valores abaixo são provisórios.
  { id: 'AR-04', nome: 'Lago do Parque Sul',      local: 'Parque Sul',    atencao: 120, critico: 160 },
];
