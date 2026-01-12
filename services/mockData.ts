
import { Magazine, ExerciseType } from '../types';

export const mockMagazines: Magazine[] = [
  {
    id: 'mag-1',
    title: 'Explorando a Biologia',
    description: 'Uma jornada visual pelo reino animal e as células da vida.',
    coverUrl: 'https://picsum.photos/seed/biology/800/1200',
    classId: 't1', // Turma Adultos
    pages: [
      {
        id: 'p1',
        pageNumber: 1,
        imageUrl: 'https://picsum.photos/seed/bio-p1/1000/1414',
        exercises: [
          {
            id: 'ex-1',
            type: ExerciseType.MULTIPLE_CHOICE,
            question: 'Qual a principal função da mitocôndria?',
            options: ['Digestão', 'Produção de energia', 'Síntese de proteínas', 'Armazenamento de água'],
            x: 75,
            y: 30
          }
        ]
      },
      {
        id: 'p2',
        pageNumber: 2,
        imageUrl: 'https://picsum.photos/seed/bio-p2/1000/1414',
        exercises: [
          {
            id: 'ex-2',
            type: ExerciseType.FREE_TEXT,
            question: 'Descreva a importância da fotossíntese para o ecossistema.',
            x: 25,
            y: 60
          }
        ]
      },
      {
        id: 'p3',
        pageNumber: 3,
        imageUrl: 'https://picsum.photos/seed/bio-p3/1000/1414',
        exercises: [
          {
            id: 'ex-3',
            type: ExerciseType.DRAWING,
            question: 'Desenhe um esquema simples de uma célula vegetal.',
            x: 50,
            y: 50
          }
        ]
      }
    ]
  },
  {
    id: 'mag-2',
    title: 'História do Brasil',
    description: 'Do período colonial até a república, com gravuras raras.',
    coverUrl: 'https://picsum.photos/seed/history/800/1200',
    classId: 't2', // Turma Juvenis
    pages: [
      {
        id: 'p1h',
        pageNumber: 1,
        imageUrl: 'https://picsum.photos/seed/hist-p1/1000/1414',
        exercises: [
          {
            id: 'ex-h1',
            type: ExerciseType.MULTIPLE_CHOICE,
            question: 'Em que ano ocorreu a Proclamação da República?',
            options: ['1822', '1888', '1889', '1930'],
            x: 30,
            y: 20
          }
        ]
      }
    ]
  },
  {
    id: 'mag-3',
    title: 'Física no Cotidiano',
    description: 'Entenda como as leis da física regem o nosso dia a dia.',
    coverUrl: 'https://picsum.photos/seed/physics/800/1200',
    classId: 't1',
    pages: [
       {
        id: 'p1f',
        pageNumber: 1,
        imageUrl: 'https://picsum.photos/seed/phys-p1/1000/1414',
        exercises: []
      }
    ]
  },
  {
    id: 'mag-4',
    title: 'Literatura Brasileira',
    description: 'Um passeio pelos clássicos e pelo modernismo.',
    coverUrl: 'https://picsum.photos/seed/lit/800/1200',
    classId: 't3', // Turma Infantil
    pages: [
       {
        id: 'p1l',
        pageNumber: 1,
        imageUrl: 'https://picsum.photos/seed/lit-p1/1000/1414',
        exercises: []
      }
    ]
  }
];
