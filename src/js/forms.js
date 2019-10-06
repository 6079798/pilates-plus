import "core-js/es/array/from";
import "core-js/es/object/assign";
import "core-js/es/string/ends-with";

import MicroModal from "micromodal";
import Pristine from "pristinejs/dist/pristine.min.js";

const form = document.forms[0];

Pristine.addValidator(
  "phone",
  value => /^((\+7|7|8)+([0-9]){10})$/g.test(value.trim()),
  "Номер в формате +71112223344 или 81112223344",
  2,
  false
);

Pristine.addValidator(
  "name",
  value =>
    /^[a-zA-Zа-яА-Я]+(([',. -][a-zA-Zа-яА-Я ])?[a-zA-Zа-яА-Я]*)*$/gi.test(
      value.trim()
    ),
  "Некорректное имя",
  2,
  false
);

Pristine.addValidator(
  "email",
  value => /\S+@\S+\.\S+/gi.test(value.trim()),
  "Некорректный email",
  2,
  false
);

Pristine.addValidator(
  "agree",
  function() {
    return this.checked;
  },
  "Проставьте согласие",
  2,
  false
);

const validatorConfig = {
  classTo: "form__group",
  errorTextParent: "form__group",
  errorClass: "form__group--danger",
  successClass: "form__group--success",
  errorTextTag: "span",
  errorTextClass: "form__error"
};

let validator;

const doSubmit = event => {
  event.preventDefault();
  const { target: form } = event;
  validator = new Pristine(form, validatorConfig);
  const isValid = validator.validate();
  if (isValid) {
    const btn = form.querySelector("button[type=submit]");
    const data = new FormData(form);
    const req = new XMLHttpRequest();
    const url = "https://echo.htmlacademy.ru";
    req.open("POST", url, true);
    req.send(data);
    req.onreadystatechange = function() {
      if (req.readyState !== 4) return;
      if (req.status !== 200) {
        alert("Ошибка отправки данных!");
      } else {
        console.log(req.responseText);
        renderSuccess(form);
      }
    };
    btn.innerText = "Загрузка...";
    btn.disabled = true;
  }
};

const resetForm = modal => {
  if (!modal) return;
  const form = modal.querySelector("form");
  if (!form) return;
  if (validator && validator instanceof Pristine) {
    validator.reset();
    validator.destroy();
  }
};

const renderSuccess = (
  form,
  title = "Спасибо!",
  message = "Мы свяжемся с вами в течение 15 минут..."
) => {
  form.closest("div").innerHTML = `<div class="success-message">
<h2 class="success-message__title">${title}</h2>
<p class="text">${message}</p>
</div>`;
};

document.addEventListener("click", ({ target }) => {
  if (!target.matches("[data-modal]")) return;
  MicroModal.show("modal", {
    disableScroll: true,
    onClose: modal => resetForm(modal)
  });
});

form.addEventListener(
  "focus",
  ({ target }) => {
    if (!target.matches(".form__input")) return;
    const label = target.parentElement.querySelector("label");
    if (label) label.classList.add("form__label--active");
  },
  true
);

form.addEventListener(
  "blur",
  ({ target }) => {
    if (!target.matches(".form__input")) return;
    const label = target.parentElement.querySelector("label");
    if (label && !target.value.trim())
      label.classList.remove("form__label--active");
  },
  true
);

form.addEventListener("submit", doSubmit);
