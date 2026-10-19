// Adlandırılmış zorluk seviyeleri. "İleri" klinik yeterlilik veya uzman onayı anlamına gelmez;
// yalnızca daha karmaşık bir egzersiz profilidir.
import { t } from '../i18n.js';

export const LEVEL_IDS = [1, 2, 3, 4, 5];
export const levelName = (n) => t(`lvl.${Math.min(5, Math.max(1, Math.round(n || 1)))}`);
