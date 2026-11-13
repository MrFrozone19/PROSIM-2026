/** Generado por npm run targets / models:import. No editar los índices a mano. */
import importedModels from '../../assets/models/imported/catalog.json' with { type: 'json' };

export const TARGETS_SRC = 'assets/targets/targets.mind?v=0f4f27637387';

export interface TeamModel {
  id: string;
  label: string;
  src: string;
  placeholder: boolean;
}

export function modelForTeam(teamId: string): TeamModel {
  const model = importedModels.models.find((entry) => entry.teams.includes(teamId));
  return model
    ? { id: model.id, label: model.label, src: model.src, placeholder: false }
    : { id: 'cube-' + teamId, label: 'Modelo provisional', src: 'assets/models/cube-' + teamId + '.glb', placeholder: true };
}

export interface ArTarget {
  index: number;
  teamId: string;
  model: string;
}

export const AR_TARGETS: ArTarget[] = [
  {
    "index": 0,
    "teamId": "nyy"
  },
  {
    "index": 1,
    "teamId": "nyy"
  },
  {
    "index": 2,
    "teamId": "nyy"
  },
  {
    "index": 3,
    "teamId": "nyy"
  },
  {
    "index": 4,
    "teamId": "bos"
  },
  {
    "index": 5,
    "teamId": "hou"
  },
  {
    "index": 6,
    "teamId": "tor"
  },
  {
    "index": 7,
    "teamId": "bal"
  },
  {
    "index": 8,
    "teamId": "tex"
  },
  {
    "index": 9,
    "teamId": "det"
  },
  {
    "index": 10,
    "teamId": "cle"
  },
  {
    "index": 11,
    "teamId": "tb"
  },
  {
    "index": 12,
    "teamId": "cws"
  },
  {
    "index": 13,
    "teamId": "kc"
  },
  {
    "index": 14,
    "teamId": "min"
  },
  {
    "index": 15,
    "teamId": "ath"
  },
  {
    "index": 16,
    "teamId": "laa"
  },
  {
    "index": 17,
    "teamId": "sea"
  }
].map((target) => ({
  ...target, model: modelForTeam(target.teamId).src,
}));
