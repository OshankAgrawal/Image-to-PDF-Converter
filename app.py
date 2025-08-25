from flask import Flask, render_template, request, send_file, jsonify
import os
from PIL import Image
from werkzeug.utils import secure_filename
import uuid

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/convert', methods=['POST'])
def convert():
    files = request.files.getlist('images')
    if not files:
        return jsonify({'error': 'No images uploaded'}), 400

    page_size = request.form.get('page_size')
    orientation = request.form.get('orientation')
    compression = request.form.get('compression')

    page_sizes = {
        'Fit-to-Image': None,
        'A4': (595, 842),
        'Letter': (612, 792)
    }

    quality_map = {'Low': 40, 'Medium': 70, 'High': 95}
    quality = quality_map.get(compression, 80)

    pdf_images = []
    for idx, file in enumerate(files):
        filename = secure_filename(file.filename)
        img_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(img_path)
        img = Image.open(img_path)
        if img.mode == 'RGBA':
            img = img.convert('RGB')

        rotation = int(request.form.get(f'rotation_{idx}', 0))
        if rotation:
            img = img.rotate(-rotation, expand=True)

        if page_sizes.get(page_size):
            width, height = page_sizes[page_size]
            if orientation == 'Landscape':
                width, height = height, width
            img = img.resize((width, height), Image.LANCZOS)

        pdf_images.append(img)

    pdf_name = f"output_{uuid.uuid4().hex}.pdf"
    pdf_path = os.path.join(UPLOAD_FOLDER, pdf_name)
    pdf_images[0].save(pdf_path, save_all=True, append_images=pdf_images[1:], quality=quality)

    size_kb = round(os.path.getsize(pdf_path) / 1024, 2)
    return jsonify({'file': pdf_name, 'size': f'{size_kb} KB'})

@app.route('/download/<filename>')
def download(filename):
    return send_file(os.path.join(UPLOAD_FOLDER, filename), as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)
