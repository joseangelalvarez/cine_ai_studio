import './style.css';
import { state, subscribe } from './store';
import {
  renderHome, bindHome,
  renderWizardStep1, bindWizardStep1,
  renderWizardStep2, bindWizardStep2,
  renderProjectList, bindProjectList,
} from './screens/home';
import { renderCreationProgress, bindCreationProgress } from './screens/progress';
import { renderProjectDetails, bindProjectDetails } from './screens/project';
import { renderVideoHub, bindVideoHub } from './screens/video';

const app = document.getElementById('app')!;
let isRendering = false;

function isTextEntryActive(): boolean {
  const active = document.activeElement as HTMLElement | null;
  if (!active) return false;
  return active.matches('input, textarea, select, [contenteditable="true"]');
}

function render() {
  if (isRendering) return;
  // No re-renderizar mientras el usuario escribe en cualquier campo de texto:
  // el re-render con innerHTML destruiría el elemento con el foco (bug del wizard paso 2).
  if (isTextEntryActive()) {
    return;
  }

  isRendering = true;
  const screen = state.screen;

  let html = '';
  let bind: () => void = () => {};

  switch (screen) {
    case 'HOME':
      html = renderHome(); bind = bindHome; break;
    case 'CREATE_WIZARD_STEP1':
      html = renderWizardStep1(); bind = bindWizardStep1; break;
    case 'CREATE_WIZARD_STEP2':
      html = renderWizardStep2(); bind = bindWizardStep2; break;
    case 'CREATION_PROGRESS':
      html = renderCreationProgress(); bind = bindCreationProgress; break;
    case 'VIDEO_HUB':
      html = renderVideoHub(); bind = bindVideoHub; break;
    case 'PROJECT_LIST':
      html = renderProjectList(); bind = bindProjectList; break;
    case 'PROJECT_DETAILS':
      html = renderProjectDetails(); bind = bindProjectDetails; break;
    default:
      html = renderHome(); bind = bindHome;
  }

  app.innerHTML = html;
  bind();
  isRendering = false;
}

subscribe(render);
render();
