# 🚀 Guia de Execução

Para executar o ecossistema completo, siga os passos abaixo utilizando 4 terminais.

### Terminal 1: Simulador (`grSim`)

1. Navegue até a pasta do `grSim`.
2. Execute:
   ```bash
   ./bin/grSim
   ```


### Terminal 2: A Ponte (Visão <-> ROS2)

1. Navegue até a raiz do seu workspace ssl-vision.
2. Ative o ambiente e execute a ponte:
   ```bash
   ./bin/vision
   ```


### Terminal 3: Nó Principal do ROS2 (ssl-VICE)

1. Navegue até a raiz do seu workspace ROS2.
2. Ative o ambiente e execute o nó:
   ```bash
   colcon build 

   source install/setup.bash 
   ou
   source intall/setup.zsh

   ros2 launch launch/launch_one.py
   ```


### Terminal 4: A Interface Gráfica (GUI)

1. Navegue até a pasta do projeto da GUI.
2. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
3. Abra a URL fornecida (ex: `http://localhost:5173/`) no seu navegador.




### Verificar dependencia em abrir a interface gráfica (GUI)



 
```bash
   npm -v
   sudo pip install npm
   npm run dev
   ```