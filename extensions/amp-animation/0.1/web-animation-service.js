import {Builder} from './web-animations';
import {registerServiceBuilder} from '../../../src/service';


export class WebAnimationService {
  /**
   * @param {!Window} win
   * @param {!Element} rootNode
   * @param {string} baseUrl
   * @param {!../../../src/service/vsync-impl.Vsync} vsync
   * @param {!../../../src/service/resources-impl.Resources} resources
   */
  createBuilder(win, rootNode, baseUrl, vsync, resources) {
    return new Builder(win, rootNode, baseUrl, vsync, resources);
  }

  /**
   * @param {!Window} win
   */
  static register(win) {
    registerServiceBuilder(win, 'web-animation', WebAnimationService);
  }
}
