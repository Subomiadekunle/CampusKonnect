import { Platform } from 'react-native';
import CampusMapNative from './CampusMap.native.tsx';
import CampusMapWeb from './CampusMap.web.tsx';

const CampusMap = Platform.OS === 'web' ? CampusMapWeb : CampusMapNative;

export default CampusMap;
