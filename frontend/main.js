const API_URL = 'http://localhost:3000';
const COMPANY_ID = 'company-x';

async function fetchDashboardData() {
  try {
    // Busca dados em paralelo
    const [bottlenecksRes, latencyRes] = await Promise.all([
      fetch(`${API_URL}/v1/audit/bottlenecks?companyId=${COMPANY_ID}`),
      fetch(`${API_URL}/v1/audit/conversion-latency?companyId=${COMPANY_ID}`)
    ]);

    if (!bottlenecksRes.ok || !latencyRes.ok) {
      throw new Error("Erro na resposta da API");
    }

    const bottlenecks = await bottlenecksRes.json();
    const latencyData = await latencyRes.json();

    updateLatencyUI(latencyData);
    updateBottlenecksUI(bottlenecks);
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    document.getElementById('bottlenecks-body').innerHTML = `
      <tr><td colspan="4" style="text-align: center; color: #ef4444; padding: 2rem;">
        ⚠️ Erro ao carregar dados.<br><br>Certifique-se de que o Backend está rodando (npm start) na porta 3000.
      </td></tr>
    `;
  }
}

function updateLatencyUI(latencyData) {
  const avgHours = latencyData.averageLatencyHours || 0;
  document.getElementById('latency-val').textContent = `${avgHours.toFixed(1)} h`;
}

function updateBottlenecksUI(bottlenecks) {
  document.getElementById('stagnant-val').textContent = bottlenecks.length;
  const tbody = document.getElementById('bottlenecks-body');
  
  if (bottlenecks.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2rem;">Nenhum gargalo detectado! Seu funil está fluindo perfeitamente. 🎉</td></tr>`;
    return;
  }

  tbody.innerHTML = bottlenecks.map(log => {
    // Tratativa de data segura
    const logDate = log.createdAt ? new Date(log.createdAt) : new Date();
    
    return `
      <tr>
        <td><strong>${log.leadId || 'Desconhecido'}</strong></td>
        <td>${log.details?.stageId || 'Etapa não informada'}</td>
        <td>${logDate.toLocaleString('pt-BR')}</td>
        <td><span class="badge">Estagnado / Risco de Perda</span></td>
      </tr>
    `;
  }).join('');
}

// Inicializar ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  fetchDashboardData();
  // Atualizar automaticamente a cada 10 segundos
  setInterval(fetchDashboardData, 10000);
});
