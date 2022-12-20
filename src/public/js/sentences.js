const confirmDelete = (id, sentence, kana) => {
    if (window.confirm(`「${sentence}」を削除しますか？`)) {
        const form = document.createElement('form')
        form.action = `/api/sentences/delete`
        form.method = 'post'
        document.body.appendChild(form)
        form.addEventListener('formdata', (e) => {
            const data = e.formData
            data.set('id', id)
            data.set('sentence', sentence)
            data.set('kana', kana)
        })
        form.submit()
    }
}
document.querySelectorAll('a.del-link').forEach(a => a.onclick = () => confirmDelete(a.dataset.id, a.dataset.sentence, a.dataset.kana))