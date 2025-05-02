<div align="center">
<a href="https://quackfy.vercel.app/">
<img height="100" src="https://ararabots-ufms.github.io/img/arara_no_bg.png" alt="Arara">
</div>

<div align="center">
<img src="https://img.shields.io/badge/build-latest-blue">
<img src="https://img.shields.io/github/issues/Ararabots-UFMS/ssl-gui">

</div>

<div align="center">
<img height="200" src="https://i.postimg.cc/wjPMX0DF/1.png"/> <img height="200" src="https://i.postimg.cc/SRyxS5pQ/2.png"/>
</div>

## Software Requirements
- [node](https://nodejs.org/pt/download)


## Installing Requirements

### Node
To install node, use the following commands:
```bash
# Download and install fnm
curl -o- https://fnm.vercel.app/install | bash

# Download and install npm 22
fnm install 22

# Check node version
node -v # should print "v22.15.0".

# Check npm version
npm -v # Should print "10.9.2".
```

## Setup
---------------------
First of all, we need to clone the [ssl-gui](https://github.com/Ararabots-UFMS/ssl-gui) repository, using the following commmands:

```bash
git clone git@github.com:Ararabots-UFMS/ssl-gui.git
```

After cloning the repository, enter the repository folder and install the repository dependences:
```bash
cd ssl-gui/
npm install # install project dependencies
```

## Usage

Finally, to run GUI in development mode use the following command:
```bash
npm run dev
```

To compile GUI for deployment use the following command:
```bash
npm run build
```