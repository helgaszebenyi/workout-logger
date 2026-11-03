export class WorkoutForm {
  // onSubmit(data, id) is called on Save; id is null when creating.
  // If it throws, the popup stays open and shows the error.
  constructor(onSubmit) {
    this.onSubmit = onSubmit;
    this.dialog = document.querySelector('#workout-dialog');
    this.form = document.querySelector('#workout-form');
    this.exerciseList = document.querySelector('#exercise-list');
    this.errorBox = document.querySelector('#form-error');
    this.editingId = null;

    document.querySelector('#add-exercise').addEventListener('click', () => this.#addExercise());
    document.querySelector('#cancel-workout').addEventListener('click', () => this.dialog.close());
    this.form.addEventListener('submit', (event) => this.#handleSubmit(event));

    // One listener on the list handles every button inside it, including rows
    // added later (event delegation), instead of one listener per button.
    this.exerciseList.addEventListener('click', (event) => this.#handleListClick(event));
    // Switching Reps/Time updates that exercise's column labels and hides kg for timed sets.
    this.exerciseList.addEventListener('change', (event) => {
      if (event.target.classList.contains('exercise-type')) {
        updateExercise(event.target.closest('.exercise'));
      }
    });
  }

  // Opens the popup: empty for a new workout, pre-filled when editing one.
  open(workout = null) {
    this.editingId = workout?.id ?? null;
    document.querySelector('#workout-form-title').textContent = workout ? 'Edit workout' : 'New workout';

    this.form.reset();
    this.#showError('');
    this.exerciseList.replaceChildren();

    this.form.elements.title.value = workout?.title ?? '';
    this.form.elements.date.value = workout?.date ?? todayIso();

    const exercises = workout?.exercises ?? [{ name: '', sets: [{}] }];
    exercises.forEach((exercise) => this.#addExercise(exercise));

    this.dialog.showModal();
  }

  #addExercise(exercise = { name: '', sets: [{}] }) {
    const node = cloneTemplate('exercise-template');
    node.querySelector('.exercise-name').value = exercise.name;
    // An exercise is timed if its sets use durationSec (e.g. plank).
    node.querySelector('.exercise-type').value = exercise.sets[0]?.durationSec ? 'time' : 'reps';
    this.exerciseList.append(node);
    exercise.sets.forEach((set) => this.#addSet(node, set));
  }

  // Adds a set row. Without a `set`, it copies the previous row's numbers,
  // because lifters usually repeat the same reps and weight.
  #addSet(exerciseNode, set = null) {
    const setsRoot = exerciseNode.querySelector('.sets');
    const node = cloneTemplate('set-template');
    const previous = setsRoot.lastElementChild;

    if (set) {
      node.querySelector('.set-amount').value = set.durationSec ?? set.reps ?? '';
      node.querySelector('.set-weight').value = set.weightKg ?? 0;
    } else if (previous) {
      node.querySelector('.set-amount').value = previous.querySelector('.set-amount').value;
      node.querySelector('.set-weight').value = previous.querySelector('.set-weight').value;
    }

    setsRoot.append(node);
    updateExercise(exerciseNode);
  }

  #handleListClick(event) {
    const button = event.target.closest('button');
    if (!button) return;
    const exerciseNode = button.closest('.exercise');

    if (button.classList.contains('add-set')) {
      this.#addSet(exerciseNode);
    } else if (button.classList.contains('remove-set')) {
      button.closest('.set').remove();
      updateExercise(exerciseNode);
    } else if (button.classList.contains('remove-exercise')) {
      exerciseNode.remove();
    }
  }

  // Turns the form into the API's shape:
  // { title, date, exercises: [{ name, sets: [{ reps, weightKg? } | { durationSec }] }] }
  #readValues() {
    return {
      title: this.form.elements.title.value.trim(),
      date: this.form.elements.date.value,
      exercises: [...this.exerciseList.querySelectorAll('.exercise')].map((exerciseNode) => {
        const timed = isTimed(exerciseNode);
        return {
          name: exerciseNode.querySelector('.exercise-name').value.trim(),
          sets: [...exerciseNode.querySelectorAll('.set')].map((setNode) => {
            const amount = Number(setNode.querySelector('.set-amount').value);
            if (timed) return { durationSec: amount };

            const weightKg = Number(setNode.querySelector('.set-weight').value);
            // Leave weight out for bodyweight sets.
            return weightKg > 0 ? { reps: amount, weightKg } : { reps: amount };
          }),
        };
      }),
    };
  }

  async #handleSubmit(event) {
    event.preventDefault(); // we save with the API instead of a page reload
    const data = this.#readValues();

    if (data.exercises.length === 0 || data.exercises.some((exercise) => exercise.sets.length === 0)) {
      this.#showError('Add at least one exercise, each with at least one set.');
      return;
    }

    const saveButton = event.submitter;
    saveButton.disabled = true; // prevent double-saving on a double click
    try {
      await this.onSubmit(data, this.editingId);
      this.dialog.close();
    } catch (error) {
      this.#showError(`Couldn't save: ${error.message}`);
    } finally {
      saveButton.disabled = false;
    }
  }

  #showError(message) {
    this.errorBox.textContent = message;
    this.errorBox.hidden = !message;
  }
}

// Copies the blueprint inside a <template>.
function cloneTemplate(id) {
  return document.querySelector(`#${id}`).content.firstElementChild.cloneNode(true);
}

function isTimed(exerciseNode) {
  return exerciseNode.querySelector('.exercise-type').value === 'time';
}

// Brings one exercise's labels up to date:
// - "Reps" or "Seconds" as the column heading,
// - the is-timed class, which hides the kg column (CSS),
// - set numbers 1, 2, 3... and a matching label for screen readers.
function updateExercise(exerciseNode) {
  const timed = isTimed(exerciseNode);
  const unit = timed ? 'Seconds' : 'Reps';

  exerciseNode.classList.toggle('is-timed', timed);
  exerciseNode.querySelector('.amount-heading').textContent = unit;

  exerciseNode.querySelectorAll('.set').forEach((setNode, index) => {
    setNode.querySelector('.set-number').textContent = index + 1;
    setNode.querySelector('.set-amount').setAttribute('aria-label', `Set ${index + 1} ${unit.toLowerCase()}`);
    setNode.querySelector('.set-weight').setAttribute('aria-label', `Set ${index + 1} weight in kg`);
  });
}

// Today's date in the user's time zone, as YYYY-MM-DD (what <input type="date"> uses).
function todayIso() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}