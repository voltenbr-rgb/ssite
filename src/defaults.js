// Configurações de página: modelo para novos assinantes e a página da Vitória (cadastro de exemplo).

export const PLANS = {
  mensal: { id: 'mensal', name: 'Mensal', price: 39.9, period: 'mês', note: 'Cancele quando quiser' },
  anual: { id: 'anual', name: 'Anual', price: 399, period: 'ano', note: 'Equivale a R$ 33,25/mês · 2 meses grátis' },
};
export const TRIAL_DAYS = 7;
export const TIERS = { completo: 'Completo', simples: 'Simples' };

export const SEGMENTS = ['Beleza e estética', 'Cílios e sobrancelhas', 'Unhas', 'Cabelo', 'Barbearia', 'Maquiagem', 'Saúde', 'Fitness', 'Outro'];

const DEFAULT_TIMES = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

export function defaultConfig({ businessName, ownerName, whatsapp, city = '' }) {
  const first = (ownerName || businessName).split(' ')[0];
  return {
    v: 1,
    template: 'glamour',
    theme: { accent: '#D45AE8', accent2: '#E58BF2', bg: '#0F0A10', cream: '#F3E9C6' },
    brand: { name: businessName, tagline: '' },
    hero: {
      eyebrow: city || 'Sua cidade',
      title: 'Agende no',
      highlight: businessName,
      subtitle: 'Conte em uma frase o que você faz e por que as clientes amam o seu trabalho.',
      address: '',
      photo: '',
      badge: businessName,
    },
    marquee: { enabled: true, words: ['Agende seu horário', 'Qualidade', 'Cuidado', businessName] },
    gallery: { enabled: true, eyebrow: 'Portfólio', title: 'Meus', highlight: 'trabalhos', note: 'Arraste para ver mais.', photos: [], round: [] },
    videos: { enabled: false, eyebrow: 'Vídeos', title: 'Bastidores', highlight: 'em movimento', items: [] },
    about: { enabled: true, eyebrow: `Prazer, ${first}`, title: 'Um pouco sobre', highlight: 'mim', photo: '', paragraphs: ['Conte aqui sua história: há quanto tempo trabalha, cursos e o que mais ama na profissão.'], tags: [] },
    services: { enabled: true, eyebrow: 'Serviços e valores', title: 'Escolha o seu', highlight: 'serviço', intro: '', items: [], note: '' },
    homeService: { enabled: false, title: 'Atendimento a domicílio', text: 'Vou até você. O valor inclui o serviço + taxa de deslocamento.', button: 'Quero em casa' },
    info: { enabled: false, eyebrow: 'Informações importantes', title: 'Antes e depois', highlight: 'do atendimento', tabs: [] },
    feedback: { enabled: false, eyebrow: 'Feedback', title: 'Quem fez,', highlight: 'amou', items: [] },
    booking: { enabled: true, title: 'Agende seu horário', times: DEFAULT_TIMES, closedWeekdays: [0] },
    contact: { title: 'Seu horário', highlight: 'te espera', address: '', instagram: '', whatsapp: whatsapp || '' },
  };
}

const V = '/seed/vitoria/';
export function vitoriaConfig() {
  return {
    v: 1,
    template: 'glamour',
    theme: { accent: '#D45AE8', accent2: '#E58BF2', bg: '#0F0A10', cream: '#F3E9C6' },
    brand: { name: 'Vitoria Carvalho', tagline: 'Lash Designer' },
    hero: {
      eyebrow: 'Campo Grande · MS',
      title: 'Venha ficar',
      highlight: 'cílhuda',
      subtitle: 'Nunca é só sobre cílios. É sobre autoestima, cuidado & amor-próprio.',
      address: 'Rua Catarino de Almeida Barbosa, 455 · Vila Nasser',
      photo: V + 'vitoria.jpg',
      badge: 'Studio Vitoria Carvalho',
    },
    marquee: { enabled: true, words: ['Venha ficar cílhuda', 'Autoestima', 'Cuidado', 'Amor-próprio', 'Lash Designer', 'Campo Grande'] },
    gallery: {
      enabled: true, eyebrow: 'Portfólio', title: 'Olhares que', highlight: 'eu criei',
      note: 'Arraste para os lados ou toque numa foto para ver de perto.',
      photos: [
        { src: V + 'foto2.jpg', alt: 'Cliente com extensão de cílios volumosa' },
        { src: V + 'foto4.jpg', alt: 'Cliente sob luz lilás mostrando os cílios' },
        { src: V + 'foto3.jpg', alt: 'Extensão de cílios com curvatura marcada' },
        { src: V + 'foto5.jpg', alt: 'Cílios volume intenso' },
        { src: V + 'foto1.jpg', alt: 'Extensão de cílios efeito natural' },
        { src: V + 'foto6.jpg', alt: 'Cliente sorrindo após a aplicação' },
      ],
      round: [
        { src: V + 'foto6.jpg', alt: 'Cliente sorrindo com cílios novos' },
        { src: V + 'foto5.jpg', alt: 'Close de cílios volumosos' },
        { src: V + 'foto4.jpg', alt: 'Cliente mostrando o resultado' },
        { src: V + 'foto1.jpg', alt: 'Extensão de cílios efeito natural' },
        { src: V + 'foto3.jpg', alt: 'Olhar com extensão de cílios' },
        { src: V + 'foto2.jpg', alt: 'Cílios volumosos de perto' },
      ],
    },
    videos: {
      enabled: true, eyebrow: 'Reels', title: 'Bastidores', highlight: 'em movimento',
      items: [
        { src: V + 'video1.mp4', poster: V + 'poster1.jpg', label: 'Aplicação dos fios' },
        { src: V + 'video2.mp4', poster: V + 'poster2.jpg', label: 'Procedimento no studio' },
        { src: V + 'video3.mp4', poster: V + 'poster3.jpg', label: 'Resultado de perto' },
      ],
    },
    about: {
      enabled: true, eyebrow: 'Prazer, Vitoria', title: 'Cada cílio aplicado com', highlight: 'carinho', photo: V + 'caricatura.jpg',
      paragraphs: [
        'Sou lash designer e atendo no meu studio na Vila Nasser, em Campo Grande. Acredito que um olhar bem feito vai além da estética: é sobre se sentir bonita, cuidada e confiante.',
      ],
      tags: ['Autoestima', 'Cuidado', 'Amor-próprio'],
    },
    services: {
      enabled: true, eyebrow: 'Técnicas e valores', title: 'Escolha o seu', highlight: 'olhar',
      intro: 'Extensões de cílios são fios sintéticos (ou tecnológicos) aplicados sobre os cílios naturais para deixar o olhar mais volumoso, alongado e definido, sem precisar de máscara.',
      items: [
        { name: 'Volume Brasileiro', price: '100,00', desc: 'Fios em formato Y que dão volume leve e um efeito natural e preenchido.', photo: V + 'servico-volume-brasileiro.jpg' },
        { name: 'Volume Egípcio', price: '120,00', desc: 'Fios em formato W, com mais densidade e um olhar marcante.', photo: V + 'servico-volume-egipcio.jpg' },
        { name: '5D', price: '130,00', desc: 'Leques com 5 pontas por fio: volume intenso e olhar bem preenchido.', photo: V + 'servico-5d.jpg' },
        { name: 'Volume Russo', price: '140,00', desc: 'Vários fios bem finos em um único cílio: mais cheio e marcante.', photo: V + 'servico-volume-russo.jpg' },
        { name: 'Fio a fio', price: '150,00', desc: 'Uma extensão em cada cílio natural. Resultado leve e natural.', photo: V + 'servico-fio-a-fio.jpg' },
      ],
      note: 'Também faço Híbrido e Mega Volume. Consulte o valor.',
    },
    homeService: { enabled: true, title: 'Atendimento a domicílio', text: 'O valor inclui o serviço + taxa de deslocamento, para te atender com conforto e segurança.', button: 'Quero em casa' },
    info: {
      enabled: true, eyebrow: 'Informações importantes', title: 'Antes e depois', highlight: 'da aplicação',
      tabs: [
        { label: 'Cuidados', big: '24h', title: 'Cuidados após a aplicação', intro: 'Para que seus cílios durem mais e continuem lindos, siga esses cuidados:', items: [
          { t: 'Não molhar nas primeiras 24h.', d: 'Evitar água por 12 a 24 horas ajuda a cola a fixar melhor.' },
          { t: 'Não esfregar nem puxar os fios.', d: 'Isso pode soltar as extensões antes da hora ou até arrancar os cílios naturais.' },
          { t: 'Evitar produtos com óleo.', d: 'Demaquilante ou creme com óleo na região dos olhos enfraquece a cola.' },
          { t: 'Dormir com cuidado.', d: 'Evite dormir com o rosto no travesseiro para não amassar os cílios.' },
          { t: 'Evitar vapor e calor excessivo.', d: 'Sauna, vapor ou banho muito quente podem soltar a cola mais rápido.' },
          { t: 'Lavar e escovar diariamente.', d: 'Use shampoo específico para cílios e uma escovinha para manter tudo alinhado.' },
        ] },
        { label: 'Duração', big: '15–25', title: 'Duração', intro: 'Quanto tempo dura a sua extensão e quando voltar.', items: [
          { t: 'Em média, 15 a 25 dias', d: 'de cílios lindos, seguindo os cuidados.' },
          { t: 'Manutenção recomendada', d: 'a cada 2 ou 3 semanas.' },
        ] },
        { label: 'Contraindicações', big: '!', title: 'Contraindicações', intro: 'A extensão não é indicada em casos de:', items: [
          { t: 'Alergia à cola.', d: '' }, { t: 'Infecção ocular.', d: '' }, { t: 'Blefarite ou irritação nos olhos.', d: '' },
        ] },
        { label: 'Alergia à cola', big: 'Teste', title: 'Aviso sobre alergia à cola', intro: 'A cola pode causar reação alérgica em algumas pessoas. Sempre que possível, indicamos um teste de alergia antes.', items: [
          { t: 'Já teve coceira, vermelhidão, inchaço ou ardência', d: 'depois de aplicar cílios? Avise antes do atendimento.' },
          { t: 'Teve alguma reação depois do procedimento?', d: 'Entre em contato para orientação e, se necessário, a remoção dos cílios.' },
        ] },
      ],
    },
    feedback: {
      enabled: true, eyebrow: 'Feedback', title: 'Quem fez,', highlight: 'amou',
      items: [
        { text: 'Eu não era acostumada a fazer cílios, aí fiz e amei. Agora não vivo sem! Seu trabalho é incrível e você se dedica muito no que faz. Amei demais!' },
        { text: 'Eu gosto de cílios bem preenchidos e bem pretinhos, e você conseguiu alcançar exatamente essa expectativa. Fiquei muito satisfeita com o resultado! E a experiência com você foi ótima, super atenciosa e delicada. Vou voltar com certeza!' },
        { text: 'Oii, estão intactos, eu estou amando!' },
      ],
    },
    booking: { enabled: true, title: 'Agende seu horário', times: DEFAULT_TIMES, closedWeekdays: [0] },
    contact: {
      title: 'Seu horário', highlight: 'te espera',
      address: 'Rua Catarino de Almeida Barbosa, 455 · Vila Nasser · Campo Grande – MS',
      instagram: 'studiovitoriacarvalho.lash', whatsapp: '5567992604640',
    },
  };
}
