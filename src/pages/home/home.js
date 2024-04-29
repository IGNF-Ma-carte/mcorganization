import element from 'ol-ext/util/element'
import team from 'mcutils/api/organization';
import api from 'mcutils/api/api'
import _T from 'mcutils/i18n/i18n'
import pages from 'mcutils/charte/pages';
import dialog from 'mcutils/dialog/dialog'

import html from './home-page.html'
import createDlg from './create-dialog.html'

import 'mcutils/api/ListTable.css'
import './home.css'
import md2html from 'mcutils/md/md2html';

const page = pages.add('home', html, document.querySelector('.connected'));

const orgaList = page.querySelector('ul[data-role="organizations"]')

// Show user organization list
function showList() {
  orgaList.innerHTML = '';
  const me = api.getMe();
  const orga = me ? me.organizations : false;
  if (orga && orga.length) {
    orga.forEach(o => {
      const li = element.create('LI', {
        className: o.public_id === team.getId() ? 'selected' : '',
        'data-orga': o.public_id,
        click: () => {
          team.set(o);
          pages.show('equipe');
        },
        parent: orgaList
      })
      element.create('IMG', {
        src: o.profile_picture || '',
        parent: li
      })
      element.create('p', {
        text: o.name,
        class: 'title',
        parent: li
      })
      element.create('DIV', {
        class: 'role role_'+o.user_role,
        title: _T('organization:role_'+o.user_role),
        parent: li
      })
    });
  } else {
    element.create('LI', {
      html: '<i>Vous n\'avez pas encore d\'équipe...</i>',
      parent: orgaList
    })
  }
}

// Refresh team list
team.on('change', showList)
team.on('change', () => {
  if (!team.getId()) {
    pages.show();
  }
})
api.on('me', showList)

// No team
if (!team.getId() && pages.getId() !== 'home') {
  pages.show();
}
pages.on('change', () => {
  if (!team.getId() && pages.getId() !== 'home') {
    pages.show();
  }
})

// Create orga
page.querySelector('.create button').addEventListener('click', () => {
  dialog.show({
    title: 'Créer une équipe',
    className: 'create-orga',
    content: createDlg,
    buttons: { submit: _T('ok'), cancel: _T('cancel')},
    onButton: (b, inputs) => {
      if (b === 'submit') {
        if (inputs.name.value) {
          dialog.showWait('Création en cours');
          api.newOrganization({ 
            name: inputs.name.value 
          }, o => {
            if (o.error) {
              // Handle error
              if (o.status === 403) {
                dialog.showAlert('Impossible de créer l\'équipe :<br/>une équipe avec le même nom existe déjà...')
              } else {
                dialog.showAlert('Impossible de créer une équipe...')
              }
            } else {
              dialog.hide();
              team.set({
                public_id: o.public_id,
                name: o.name,
                profile_picture: o.profile_picture,
                user_role: "owner"
              });
              pages.show('profil');
              // Reload page
              location.reload();
            }
          })
        }
      }
    }
  })
})

/* DBUG */
window.team = team
/**/