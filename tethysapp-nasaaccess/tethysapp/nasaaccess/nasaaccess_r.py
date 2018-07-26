import os, random, string, smtplib, tempfile, shutil
from .GLDASpolyCentroid import GLDASpolyCentroid
from .GPMpolyCentroid import GPMpolyCentroid
from .GPMswat import GPMswat
from .GLDASwat import GLDASwat
from .config import data_path, temp_path
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

def nasaaccess_run(email, models, watershed, dem, start, end):
    shp_path = os.path.join(data_path, 'shapefiles', watershed, watershed + '.shp')
    dem_path = os.path.join(data_path, 'DEMfiles', dem + '.tif')
    unique_id = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(6))
    unique_path = os.path.join(data_path, 'outputs', unique_id,'nasaaccess_data')
    os.makedirs(unique_path, 0777)
    tempdir = os.path.join(temp_path, unique_id)
    os.makedirs(tempdir, 0777)
    cwd = os.getcwd()
    print(cwd)
   
    os.chdir(tempdir)

    for model in models:
        if model == 'GPMpolyCentroid':
            output_path = unique_path + '/GPMpolyCentroid/'
            os.makedirs(output_path, 0777)
            print('running GPMpoly')
            GPMpolyCentroid(output_path, shp_path, dem_path, start, end)
        elif model == 'GPMswat':
            output_path = unique_path + '/GPMswat/'
            os.makedirs(output_path, 0777)
            print('running GPMswat')
            GPMswat(output_path, shp_path, dem_path, start, end)
        elif model == 'GLDASpolyCentroid':
            output_path = unique_path + '/GLDASpolyCentroid/'
            os.makedirs(output_path, 0777)
            print('running GLDASpoly')
            GLDASpolyCentroid(tempdir, output_path, shp_path, dem_path, start, end)
        elif model == 'GLDASwat':
            output_path = unique_path + '/GLDASwat/'
            os.makedirs(output_path, 0777)
            print('running GLDASwat')
            GLDASwat(output_path, shp_path, dem_path, start, end)




    from_email = 'nasaaccess@gmail.com'
    to_email = email

    msg = MIMEMultipart('alternative')
    msg['Subject'] = 'Your nasaaccess data is ready'

    msg['From'] = from_email
    msg['To'] = to_email

    message = """\
        <html>
            <head></head>
            <body>
                <p>Hello,<br>
                   Your nasaaccess data is ready for download at <a href="http://tethys-servir-mekong.adpc.net/apps/nasaaccess">http://tethys-servir-mekong.adpc.net/apps/nasaaccess</a><br>
                   Your unique access code is: <strong>""" + unique_id + """</strong><br>
                </p>
            </body>
        <html>
    """

    part1 = MIMEText(message, 'html')
    msg.attach(part1)

    gmail_user = 'nasaaccess@gmail.com'
    gmail_pwd = 'nasaaccess123'
    smtpserver = smtplib.SMTP('smtp.gmail.com', 587)
    smtpserver.ehlo()
    smtpserver.starttls()
    smtpserver.ehlo()
    smtpserver.login(gmail_user, gmail_pwd)
    smtpserver.sendmail(gmail_user, to_email, msg.as_string())
    smtpserver.close()

