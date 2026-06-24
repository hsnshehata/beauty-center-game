// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║   💄 سنتر الغرام - 3D Render Engine (Three.js)                            ║
// ║   Creates the 3D scene, models, lighting, shadows, and animations.        ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ROOM_LAYOUTS, ROOM_COSTS } from './state.js';

export class Renderer3D {
    constructor(gameState, uiManager, canvasId) {
        this.game = gameState;
        this.ui = uiManager;
        this.canvasId = canvasId;
        
        this.roomGroups = {}; // roomId -> THREE.Group
        this.characters = {}; // charId -> THREE.Group
        this.staffGroups = {}; // staffId -> THREE.Group
        this.particles = [];   // array of active particles
        
        // Raycasting
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.dragStart = { x: 0, y: 0 };
    }

    init() {
        const canvas = document.getElementById(this.canvasId);
        
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#0c0b16');
        
        // Fog for depth
        this.scene.fog = new THREE.FogExp2('#0c0b16', 0.025);

        // Camera
        this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(-18, 16, 22);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.05;

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2.1; // Don't go below floor
        this.controls.minDistance = 8;
        this.controls.maxDistance = 45;
        this.controls.target.set(1, 0, 1);

        // Lighting
        this.setupLights();

        // Floor and Walls
        this.createEnvironment();

        // Populate Rooms
        this.updateRooms();

        // Initial Staff placement
        this.updateStaff();

        // Event Listeners
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Setup raycasting input
        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    }

    setupLights() {
        // Ambient soft illumination
        const ambient = new THREE.AmbientLight('#ffffff', 0.4);
        this.scene.add(ambient);

        // Sun-like directional light for shadows
        this.dirLight = new THREE.DirectionalLight('#fff5ea', 0.85);
        this.dirLight.position.set(-15, 25, 10);
        this.dirLight.castShadow = true;
        
        this.dirLight.shadow.mapSize.width = 2048;
        this.dirLight.shadow.mapSize.height = 2048;
        this.dirLight.shadow.camera.near = 0.5;
        this.dirLight.shadow.camera.far = 60;
        
        const d = 20;
        this.dirLight.shadow.camera.left = -d;
        this.dirLight.shadow.camera.right = d;
        this.dirLight.shadow.camera.top = d;
        this.dirLight.shadow.camera.bottom = -d;
        this.dirLight.shadow.bias = -0.0003;
        
        this.scene.add(this.dirLight);

        // Soft floor bounce light
        const hemiLight = new THREE.HemisphereLight('#b3e5fc', '#1c1b2c', 0.35);
        this.scene.add(hemiLight);
    }

    createEnvironment() {
        // Main Salon floor (gloss floor tiles with custom color)
        const floorGeo = new THREE.BoxGeometry(26, 0.2, 20);
        const floorMat = new THREE.MeshStandardMaterial({
            color: '#eae3db',
            roughness: 0.12,
            metalness: 0.05
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.position.y = -0.1;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Tiled Grid Lines overlay
        const gridHelper = new THREE.GridHelper(26, 26, '#e91e63', 'rgba(0,0,0,0.06)');
        gridHelper.position.y = 0.01;
        this.scene.add(gridHelper);

        // Outer low walls
        const wallMat = new THREE.MeshStandardMaterial({ color: '#f3ece3', roughness: 0.7 });
        
        // Back Wall
        const wallBack = new THREE.Mesh(new THREE.BoxGeometry(26, 1.8, 0.3), wallMat);
        wallBack.position.set(0, 0.9, -10);
        wallBack.castShadow = true;
        wallBack.receiveShadow = true;
        this.scene.add(wallBack);

        // Left Wall
        const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.8, 20), wallMat);
        wallLeft.position.set(-13, 0.9, 0);
        wallLeft.castShadow = true;
        wallLeft.receiveShadow = true;
        this.scene.add(wallLeft);

        // Right Wall
        const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.8, 20), wallMat);
        wallRight.position.set(13, 0.9, 0);
        wallRight.castShadow = true;
        wallRight.receiveShadow = true;
        this.scene.add(wallRight);

        // Front wall with entrance opening
        const wallFrontL = new THREE.Mesh(new THREE.BoxGeometry(10, 1.8, 0.3), wallMat);
        wallFrontL.position.set(-8, 0.9, 10);
        wallFrontL.castShadow = true;
        wallFrontL.receiveShadow = true;
        this.scene.add(wallFrontL);

        const wallFrontR = new THREE.Mesh(new THREE.BoxGeometry(12, 1.8, 0.3), wallMat);
        wallFrontR.position.set(7, 0.9, 10);
        wallFrontR.castShadow = true;
        wallFrontR.receiveShadow = true;
        this.scene.add(wallFrontR);

        // Entrance glass door frames (pinkish metal)
        const frameMat = new THREE.MeshStandardMaterial({ color: '#e91e63', metalness: 0.7, roughness: 0.2 });
        const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(4, 2.2, 0.15), frameMat);
        doorFrame.position.set(-1, 1.1, 10);
        this.scene.add(doorFrame);

        // Door glass pane
        const glassMat = new THREE.MeshPhysicalMaterial({
            color: '#80deea',
            transparent: true,
            opacity: 0.3,
            transmission: 0.9,
            roughness: 0.1
        });
        const doorGlass = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.0, 0.05), glassMat);
        doorGlass.position.set(-1, 1.0, 10);
        this.scene.add(doorGlass);
        
        // Potted plants at entrance
        this.createPlantMesh(-2.5, 9.3);
        this.createPlantMesh(0.5, 9.3);

        // 🌟 ADD GLOWING NEON SIGN ON BACK WALL
        this.createNeonSign();
    }

    createNeonSign() {
        const neonGroup = new THREE.Group();
        neonGroup.position.set(0, 2.3, -9.8);

        // Glowing heart shape outline in pink emissive
        const heartShape = new THREE.Shape();
        const x = 0, y = 0;
        heartShape.moveTo( x + 0.4, y + 0.4 );
        heartShape.bezierCurveTo( x + 0.4, y + 0.4, x + 0.3, y, x, y );
        heartShape.bezierCurveTo( x - 0.5, y, x - 0.5, y + 0.6, x - 0.5, y + 0.6 );
        heartShape.bezierCurveTo( x - 0.5, y + 0.9, x - 0.25, y + 1.25, x + 0.4, y + 1.6 );
        heartShape.bezierCurveTo( x + 1.05, y + 1.25, x + 1.3, y + 0.9, x + 1.3, y + 0.6 );
        heartShape.bezierCurveTo( x + 1.3, y + 0.6, x + 1.3, y, x + 0.8, y );
        heartShape.bezierCurveTo( x + 0.5, y, x + 0.4, y + 0.4, x + 0.4, y + 0.4 );

        const extrudeSettings = { depth: 0.08, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.01, bevelThickness: 0.01 };
        const heartGeo = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
        
        const neonMat = new THREE.MeshStandardMaterial({
            color: '#ff1744',
            emissive: '#ff1744',
            emissiveIntensity: 3.0,
            roughness: 0.1
        });
        const heartMesh = new THREE.Mesh(heartGeo, neonMat);
        heartMesh.scale.set(0.65, -0.65, 1);
        heartMesh.position.set(-0.25, 0.5, 0); // centering
        neonGroup.add(heartMesh);

        // Point Light to illuminate the wall
        const neonLight = new THREE.PointLight('#ff1744', 1.8, 10);
        neonLight.position.set(0, 0, 0.4);
        neonGroup.add(neonLight);

        this.scene.add(neonGroup);
    }

    createPlantMesh(x, z) {
        const plantGroup = new THREE.Group();
        plantGroup.position.set(x, 0, z);

        // Pot
        const pot = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.2, 0.6, 8),
            new THREE.MeshStandardMaterial({ color: '#795548', roughness: 0.5 })
        );
        pot.position.y = 0.3;
        pot.castShadow = true;
        plantGroup.add(pot);

        // Leaves (spherical hierarchy)
        const leafMat = new THREE.MeshStandardMaterial({ color: '#2e7d32', roughness: 0.8 });
        const leaves1 = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 6), leafMat);
        leaves1.position.y = 0.75;
        leaves1.castShadow = true;
        plantGroup.add(leaves1);

        const leaves2 = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6, 6), leafMat);
        leaves2.position.set(0.1, 0.9, -0.05);
        leaves2.castShadow = true;
        plantGroup.add(leaves2);

        this.scene.add(plantGroup);
    }

    updateRooms() {
        Object.keys(ROOM_LAYOUTS).forEach(roomId => {
            const layout = ROOM_LAYOUTS[roomId];
            const roomState = this.game.rooms[roomId];

            // Remove existing room visual if any
            if (this.roomGroups[roomId]) {
                this.scene.remove(this.roomGroups[roomId]);
                delete this.roomGroups[roomId];
            }

            const roomGroup = new THREE.Group();
            roomGroup.position.set(layout.x, 0, layout.z);
            roomGroup.rotation.y = layout.yRot;
            roomGroup.userData = { roomId }; // for raycasting

            // Build Room Boundary box for mouse hover/clicks
            const boundGeo = new THREE.BoxGeometry(layout.w, 0.05, layout.d);
            
            if (roomState.built) {
                // Room is BUILT
                // Floor base tile
                const floorTile = new THREE.Mesh(
                    boundGeo,
                    new THREE.MeshStandardMaterial({
                        color: layout.color,
                        roughness: 0.5,
                        transparent: true,
                        opacity: 0.15
                    })
                );
                floorTile.receiveShadow = true;
                roomGroup.add(floorTile);

                // Add glass partitions between sections
                this.createGlassPartition(roomGroup, layout);

                // Add furniture meshes based on room type
                this.addFurniture(roomGroup, roomId, roomState.level);
            } else {
                // Room is LOCKED (unbuilt)
                // Wireframe/dashed outline box
                const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(layout.w, 0.2, layout.d));
                const lineMat = new THREE.LineBasicMaterial({ color: '#ff4081', linewidth: 1 });
                const wireframe = new THREE.LineSegments(edges, lineMat);
                wireframe.position.y = 0.1;
                roomGroup.add(wireframe);

                // Add a floating lock visual
                const lockGroup = new THREE.Group();
                lockGroup.name = 'lockVisual';
                lockGroup.position.y = 1.0;
                
                // Padlock base
                const lockBase = new THREE.Mesh(
                    new THREE.BoxGeometry(0.3, 0.25, 0.15),
                    new THREE.MeshStandardMaterial({ color: '#ffd700', metalness: 0.8, roughness: 0.1 })
                );
                lockGroup.add(lockBase);

                // Padlock shackle (torus/loop)
                const lockLoop = new THREE.Mesh(
                    new THREE.TorusGeometry(0.12, 0.04, 8, 12, Math.PI),
                    new THREE.MeshStandardMaterial({ color: '#cccccc', metalness: 0.9, roughness: 0.1 })
                );
                lockLoop.position.y = 0.12;
                lockGroup.add(lockLoop);

                roomGroup.add(lockGroup);
            }

            this.scene.add(roomGroup);
            this.roomGroups[roomId] = roomGroup;
        });
    }

    createGlassPartition(roomGroup, layout) {
        // Decorative glass partition wall on the right side of the room
        const pGeo = new THREE.BoxGeometry(0.08, 1.8, layout.d);
        const pMat = new THREE.MeshPhysicalMaterial({
            color: '#e91e63',
            roughness: 0.15,
            transmission: 0.85,
            transparent: true,
            opacity: 0.4
        });
        const partition = new THREE.Mesh(pGeo, pMat);
        partition.position.set(layout.w / 2, 0.9, 0);
        roomGroup.add(partition);
    }

    addFurniture(group, roomId, level) {
        const woodMat = new THREE.MeshStandardMaterial({ color: '#8d6e63', roughness: 0.6 });
        const plasticMat = new THREE.MeshStandardMaterial({ color: '#eeeeee', roughness: 0.3 });
        const fabricMat = new THREE.MeshStandardMaterial({ color: '#ec407a', roughness: 0.8 });
        const mirrorMat = new THREE.MeshPhysicalMaterial({ color: '#e0f7fa', roughness: 0.1, transmission: 0.6, transparent: true, opacity: 0.6 });
        const goldMat = new THREE.MeshStandardMaterial({ color: '#ffd700', metalness: 0.8, roughness: 0.2 });

        switch (roomId) {
            case 'reception':
                // Desk
                const desk = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 0.6), woodMat);
                desk.position.set(0, 0.4, 0);
                desk.castShadow = true;
                desk.receiveShadow = true;
                group.add(desk);

                // Monitor
                const screen = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.05), plasticMat);
                screen.position.set(0, 0.95, 0.1);
                screen.rotation.y = Math.PI;
                screen.castShadow = true;
                group.add(screen);

                const screenStand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2), plasticMat);
                screenStand.position.set(0, 0.8, 0.1);
                group.add(screenStand);

                // Register bell
                const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04), goldMat);
                bell.position.set(-0.4, 0.82, -0.1);
                group.add(bell);
                break;

            case 'lounge':
                // Circular Persian rug under couches
                const rugGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.02, 16);
                const rugMat = new THREE.MeshStandardMaterial({ color: '#3f1d4f', roughness: 0.9 });
                const rug = new THREE.Mesh(rugGeo, rugMat);
                rug.position.y = 0.01;
                rug.receiveShadow = true;
                group.add(rug);

                // Couches
                this.createCouch(group, -0.9, 0, 0, Math.PI/2);
                this.createCouch(group, 0.9, 0, 0, -Math.PI/2);
                
                // Table
                const coffeeTable = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.35, 1.2), woodMat);
                coffeeTable.position.set(0, 0.175, 0);
                coffeeTable.castShadow = true;
                group.add(coffeeTable);
                break;

            case 'makeup':
                // Makeup Desk
                const mDesk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.75, 0.6), woodMat);
                mDesk.position.set(0, 0.375, -0.4);
                mDesk.castShadow = true;
                group.add(mDesk);

                // Chair
                this.createChair(group, 0, 0.3, 0.1, 0);

                // Mirror with vanity lights
                const mFrame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 0.1), plasticMat);
                mFrame.position.set(0, 1.25, -0.65);
                mFrame.castShadow = true;
                group.add(mFrame);

                const mGlass = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.02), mirrorMat);
                mGlass.position.set(0, 1.25, -0.59);
                group.add(mGlass);

                // Vanity Lights (glowing spheres)
                const lightMat = new THREE.MeshBasicMaterial({ color: '#ffffe0' });
                for (let xOffset = -0.6; xOffset <= 0.6; xOffset += 0.3) {
                    const light = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), lightMat);
                    light.position.set(xOffset, 1.7, -0.55);
                    group.add(light);
                }
                break;

            case 'hair':
                // Styling Chair (faces forward)
                this.createChair(group, 0, 0.3, -0.1, Math.PI); 

                // Styling Station Table
                const hTable = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.75, 0.4), plasticMat);
                hTable.position.set(0, 0.375, -0.6);
                hTable.castShadow = true;
                group.add(hTable);

                // Mirror
                const hMirror = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.2, 0.05), mirrorMat);
                hMirror.position.set(0, 1.35, -0.75);
                group.add(hMirror);
                break;

            case 'nails':
                // Manicure Table
                const nTable = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.75, 0.6), plasticMat);
                nTable.position.set(0, 0.375, 0);
                nTable.castShadow = true;
                group.add(nTable);

                // Two chairs facing each other
                this.createChair(group, 0, 0.35, -0.5, 0); // Stylist
                this.createChair(group, 0, 0.35, 0.5, Math.PI); // Client

                // Nail polish mini bottles
                const redPolish = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.08), new THREE.MeshStandardMaterial({ color: '#f44336' }));
                redPolish.position.set(-0.2, 0.8, -0.1);
                group.add(redPolish);

                const pinkPolish = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.08), new THREE.MeshStandardMaterial({ color: '#e91e63' }));
                pinkPolish.position.set(-0.15, 0.8, -0.05);
                group.add(pinkPolish);
                break;

            case 'spa':
                // Jacuzzi tub
                const tubMat = new THREE.MeshStandardMaterial({ color: '#b2dfdb', roughness: 0.25 });
                const tubOuter = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.6, 12), tubMat);
                tubOuter.position.set(0, 0.3, 0);
                tubOuter.castShadow = true;
                group.add(tubOuter);

                // Water
                const waterMat = new THREE.MeshStandardMaterial({
                    color: '#00e5ff',
                    roughness: 0.1,
                    metalness: 0.8,
                    transparent: true,
                    opacity: 0.8
                });
                const water = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.05, 12), waterMat);
                water.position.set(0, 0.55, 0);
                group.add(water);
                break;

            case 'skincare':
                // Facial bed
                const scBed = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 1.6), plasticMat);
                scBed.position.set(0, 0.3, 0);
                scBed.castShadow = true;
                group.add(scBed);

                // Pillow
                const scPillow = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.3), fabricMat);
                scPillow.position.set(0, 0.65, -0.6);
                group.add(scPillow);
                break;

            case 'massage':
                // Massage Table
                const mBed = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 1.7), woodMat);
                mBed.position.set(0, 0.3, 0);
                mBed.castShadow = true;
                group.add(mBed);

                const mSheet = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.08, 1.66), fabricMat);
                mSheet.position.set(0, 0.64, 0);
                group.add(mSheet);
                break;

            case 'coffee':
                // Counter bar
                const bar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 0.5), woodMat);
                bar.position.set(-0.3, 0.4, -0.3);
                bar.castShadow = true;
                group.add(bar);

                // Stools
                this.createStool(group, -0.3, 0.3, 0.2);
                this.createStool(group, 0.2, 0.3, 0.2);

                // Coffee machine model
                const coffeeMachine = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.45, 0.3), plasticMat);
                coffeeMachine.position.set(-0.5, 1.0, -0.35);
                group.add(coffeeMachine);
                break;

            case 'store':
                // Shelf Rack
                const rack = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.5, 0.3), woodMat);
                rack.position.set(0, 0.75, -0.6);
                rack.castShadow = true;
                group.add(rack);

                // Placed products on shelves
                for (let r = 0.3; r <= 1.3; r += 0.4) {
                    for (let x = -0.5; x <= 0.5; x += 0.3) {
                        const itemGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.15, 6);
                        const itemMat = new THREE.MeshStandardMaterial({
                            color: new THREE.Color().setHSL(Math.random(), 0.8, 0.6)
                        });
                        const item = new THREE.Mesh(itemGeo, itemMat);
                        item.position.set(x, r, -0.5);
                        group.add(item);
                    }
                }
                break;

            case 'waxing':
                // Waxing Bed
                const wBed = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 1.6), woodMat);
                wBed.position.set(0, 0.3, 0);
                wBed.castShadow = true;
                group.add(wBed);

                // Waxing pot heater
                const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.2), goldMat);
                pot.position.set(-0.45, 0.7, -0.4);
                group.add(pot);
                break;

            case 'bridal':
                // Podium platform
                const stage = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.3, 0.25, 16), fabricMat);
                stage.position.set(0, 0.125, 0.2);
                stage.castShadow = true;
                group.add(stage);

                // Mirror
                const bMirror = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.0, 0.05), mirrorMat);
                bMirror.position.set(0, 1.0, -0.8);
                group.add(bMirror);

                // Wedding dress mannequin
                const manBody = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.2, 8), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.1 }));
                manBody.position.set(0, 0.8, 0.2);
                manBody.castShadow = true;
                group.add(manBody);

                const manHead = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), plasticMat);
                manHead.position.set(0, 1.45, 0.2);
                group.add(manHead);
                break;
        }
    }

    createChair(group, x, y, z, rotationY) {
        const chair = new THREE.Group();
        chair.position.set(x, y, z);
        chair.rotation.y = rotationY;

        // Base & leg
        const chrome = new THREE.MeshStandardMaterial({ color: '#cccccc', metalness: 0.9, roughness: 0.1 });
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.05), chrome);
        chair.add(base);

        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35), chrome);
        leg.position.y = 0.15;
        chair.add(leg);

        // Cushion Seat
        const cushionMat = new THREE.MeshStandardMaterial({ color: '#ec407a', roughness: 0.7 });
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.44), cushionMat);
        seat.position.y = 0.35;
        seat.castShadow = true;
        chair.add(seat);

        // Backrest
        const back = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.45, 0.08), cushionMat);
        back.position.set(0, 0.6, -0.18);
        back.castShadow = true;
        chair.add(back);

        group.add(chair);
    }

    createCouch(group, x, y, z, rotationY) {
        const couch = new THREE.Group();
        couch.position.set(x, y, z);
        couch.rotation.y = rotationY;

        const leather = new THREE.MeshStandardMaterial({ color: '#4e342e', roughness: 0.8 });
        
        // Base
        const cBase = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.25, 1.2), leather);
        cBase.position.y = 0.125;
        cBase.castShadow = true;
        couch.add(cBase);

        // Back
        const cBack = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.6, 1.2), leather);
        cBack.position.set(-0.2, 0.45, 0);
        cBack.castShadow = true;
        couch.add(cBack);

        // Armrests
        const armL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.15), leather);
        armL.position.set(0.05, 0.3, 0.525);
        couch.add(armL);

        const armR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.15), leather);
        armR.position.set(0.05, 0.3, -0.525);
        couch.add(armR);

        group.add(couch);
    }

    createStool(group, x, y, z) {
        const stool = new THREE.Group();
        stool.position.set(x, 0, z);

        const chrome = new THREE.MeshStandardMaterial({ color: '#cccccc', metalness: 0.9, roughness: 0.1 });
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6), chrome);
        leg.position.y = 0.3;
        stool.add(leg);

        const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06), new THREE.MeshStandardMaterial({ color: '#ff7043' }));
        seat.position.y = 0.6;
        stool.add(seat);

        group.add(stool);
    }

    updateStaff() {
        Object.keys(this.staffGroups).forEach(id => {
            this.scene.remove(this.staffGroups[id]);
        });
        this.staffGroups = {};

        this.game.staff.forEach(s => {
            const group = new THREE.Group();
            
            // Build custom staff character with pink uniform
            this.buildCharacterMesh(group, s);
            
            // Set position standing next to their corresponding built room
            const layout = ROOM_LAYOUTS[s.role];
            if (layout) {
                let offset = { x: 0.6, z: 0.6 };
                if (s.role === 'reception') offset = { x: 0, z: -0.4 };
                if (s.role === 'hair') offset = { x: 0.5, z: -0.4 };
                if (s.role === 'makeup') offset = { x: -0.5, z: -0.4 };
                if (s.role === 'nails') offset = { x: 0.4, z: -0.4 };
                
                group.position.set(layout.x + offset.x, 0, layout.z + offset.z);
                group.rotation.y = layout.yRot + Math.PI; // face the room chair
            }

            this.scene.add(group);
            this.staffGroups[s.id] = group;
        });
    }

    updateCharacters(dt) {
        const activeIds = {};

        this.game.customers.forEach(c => {
            activeIds[c.id] = true;

            const dx = c.targetX - c.x;
            const dz = c.targetZ - c.z;
            const dist = Math.sqrt(dx*dx + dz*dz);
            const walkSpeed = 3.5;

            if (dist > 0.05) {
                c.x += (dx / dist) * walkSpeed * dt;
                c.z += (dz / dist) * walkSpeed * dt;
                c.animState = 'walk';
                c.sitting = false;
                c.rotationY = Math.atan2(dx, dz);
            } else {
                c.x = c.targetX;
                c.z = c.targetZ;
                c.animState = c.sitting ? 'sitting' : 'idle';
                
                if (c.sitting && ROOM_LAYOUTS[c.room]) {
                    c.rotationY = ROOM_LAYOUTS[c.room].yRot;
                }
            }

            // Create mesh if not exists
            if (!this.characters[c.id]) {
                const group = new THREE.Group();
                group.userData = { customerId: c.id }; // Store customer ID for clicks
                this.buildCharacterMesh(group, c);
                this.scene.add(group);
                this.characters[c.id] = group;
            }

            const mesh = this.characters[c.id];
            mesh.position.set(c.x, c.y, c.z);
            if (c.rotationY !== undefined) {
                mesh.rotation.y = c.rotationY;
            }

            // Apply animations
            this.animateCharacter(mesh, c, dt);
            
            // Generate progress particles if in service
            if (c.state === 'in_service' && Math.random() < 0.05) {
                this.spawnParticles(c.x, c.y + 1.2, c.z, c.room);
            }
        });

        // Clean deleted customers
        Object.keys(this.characters).forEach(id => {
            if (!activeIds[id]) {
                this.scene.remove(this.characters[id]);
                delete this.characters[id];
            }
        });

        // Animate Staff
        this.game.staff.forEach(s => {
            const mesh = this.staffGroups[s.id];
            if (mesh) {
                const dummyChar = { animState: s.busy ? 'work' : 'idle', id: s.id };
                this.animateCharacter(mesh, dummyChar, dt);
                
                if (s.busy && Math.random() < 0.03) {
                    this.spawnParticles(mesh.position.x, mesh.position.y + 1.2, mesh.position.z, 'work');
                }
            }
        });
    }

    buildCharacterMesh(group, charObj) {
        const skinColor = charObj.skinColor || '#ffccbc';
        const hairColor = charObj.hairColor || (charObj.emoji === '👱‍♀️' ? '#ffd54f' : (charObj.emoji === '👩‍🦰' ? '#ff7043' : '#37474f'));
        const hairStyle = charObj.hairStyle || 'ponytail';
        const outfitColor = charObj.outfitColor || (charObj.isVip ? '#ffd700' : (charObj.isBride ? '#ffffff' : '#00acc1'));
        const hasCrown = charObj.isBride || false;
        const isStaff = charObj.isStaff || false;

        // Head
        const headGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
        const headMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.8 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.05;
        head.name = 'head';
        head.castShadow = true;
        group.add(head);

        // Eyes
        const eyeMat = new THREE.MeshBasicMaterial({ color: '#000000' });
        const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.02), eyeMat);
        eyeL.position.set(-0.08, 1.05, 0.175);
        group.add(eyeL);
        const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.02), eyeMat);
        eyeR.position.set(0.08, 1.05, 0.175);
        group.add(eyeR);

        // Hair Mesh based on hairStyle
        const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.9 });
        
        // Hair base cap
        const hairCap = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.15, 0.37), hairMat);
        hairCap.position.y = 1.2;
        group.add(hairCap);

        if (hairStyle === 'ponytail') {
            const ponytail = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), hairMat);
            ponytail.position.set(0, 1.15, -0.2);
            group.add(ponytail);
        } else if (hairStyle === 'double_buns') {
            const bunL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), hairMat);
            bunL.position.set(-0.16, 1.3, 0);
            group.add(bunL);
            const bunR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), hairMat);
            bunR.position.set(0.16, 1.3, 0);
            group.add(bunR);
        } else if (hairStyle === 'curly') {
            for (let xo = -0.15; xo <= 0.15; xo += 0.1) {
                for (let yo = 1.15; yo <= 1.25; yo += 0.1) {
                    const curl = new THREE.Mesh(new THREE.SphereGeometry(0.06, 4, 4), hairMat);
                    curl.position.set(xo + (Math.random()*0.02-0.01), yo, -0.05 + (Math.random()*0.02-0.01));
                    group.add(curl);
                }
            }
        } else if (hairStyle === 'bob') {
            const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.25, 0.37), hairMat);
            sideL.position.set(-0.17, 1.05, 0);
            group.add(sideL);
            const sideR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.25, 0.37), hairMat);
            sideR.position.set(0.17, 1.05, 0);
            group.add(sideR);
        } else if (hairStyle === 'hijab') {
            const hijabGeo = new THREE.BoxGeometry(0.39, 0.39, 0.39);
            const hijabMat = new THREE.MeshStandardMaterial({ color: isStaff ? '#4a148c' : '#5e35b1', roughness: 0.8 });
            const hijab = new THREE.Mesh(hijabGeo, hijabMat);
            hijab.position.y = 1.05;
            group.add(hijab);
            hairCap.visible = false;
        }

        // Crown
        if (hasCrown) {
            const crown = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 4, 10), new THREE.MeshStandardMaterial({ color: '#ffd700', metalness: 0.9 }));
            crown.position.y = 1.25;
            crown.rotation.x = Math.PI/2;
            group.add(crown);
        }

        // Torso
        const bodyGeo = new THREE.CylinderGeometry(0.15, 0.25, 0.6, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: outfitColor, roughness: 0.7 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.55;
        body.name = 'body';
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        // Staff Apron
        if (isStaff) {
            const apronMat = new THREE.MeshStandardMaterial({ color: '#e91e63', roughness: 0.8 });
            const apron = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.4, 0.05), apronMat);
            apron.position.set(0, 0.5, 0.16);
            group.add(apron);
        }

        // Legs
        const legMat = new THREE.MeshStandardMaterial({ color: skinColor });
        const legL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.3, 0.07), legMat);
        legL.position.set(-0.08, 0.15, 0);
        legL.name = 'legL';
        legL.castShadow = true;
        group.add(legL);

        const legR = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.3, 0.07), legMat);
        legR.position.set(0.08, 0.15, 0);
        legR.name = 'legR';
        legR.castShadow = true;
        group.add(legR);

        // Arms
        const armL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.06), bodyMat);
        armL.position.set(-0.2, 0.65, 0);
        armL.name = 'armL';
        group.add(armL);

        const armR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.06), bodyMat);
        armR.position.set(0.2, 0.65, 0);
        armR.name = 'armR';
        group.add(armR);
    }

    animateCharacter(group, c, dt) {
        const time = Date.now() * 0.005;
        const legL = group.getObjectByName('legL');
        const legR = group.getObjectByName('legR');
        const armL = group.getObjectByName('armL');
        const armR = group.getObjectByName('armR');
        const head = group.getObjectByName('head');
        const body = group.getObjectByName('body');

        // Reset positions/rotations
        if (legL) { legL.rotation.x = 0; legL.position.set(-0.08, 0.15, 0); }
        if (legR) { legR.rotation.x = 0; legR.position.set(0.08, 0.15, 0); }
        if (armL) { armL.rotation.x = 0; armL.rotation.z = 0; armL.position.set(-0.2, 0.65, 0); }
        if (armR) { armR.rotation.x = 0; armR.rotation.z = 0; armR.position.set(0.2, 0.65, 0); }
        if (head) { head.position.y = 1.05; head.rotation.y = 0; }
        if (body) { body.position.y = 0.55; body.rotation.z = 0; }
        group.position.y = 0;

        // Dynamic reactions based on comments
        if (c.comment) {
            const isHappyComment = ['خدمة ممتازة', 'أحسنتوا', 'أحلى بيوتي', 'شغل نظيف', 'أفضل تجربة', 'برافو'].some(term => c.comment.includes(term));
            
            if (isHappyComment) {
                // Happy reaction: bounce and spin!
                group.position.y = Math.abs(Math.sin(time * 12)) * 0.4;
                group.rotation.y += dt * 8;
                if (armL) armL.rotation.z = 1.8;
                if (armR) armR.rotation.z = -1.8;
                return;
            } else if (c.comment.includes('طويل') || c.comment.includes('غالي') || c.comment.includes('مش كويس') || c.comment.includes('تأخير') || c.comment.includes('غاضبة')) {
                // Angry reaction: stomp and shake head!
                if (head) head.rotation.y = Math.sin(time * 22) * 0.35;
                if (body) body.rotation.z = Math.sin(time * 14) * 0.15;
                if (armL) armL.rotation.x = 0.5;
                if (armR) armR.rotation.x = 0.5;
                return;
            }
        }

        if (c.animState === 'walk') {
            const swing = Math.sin(time * 2.5) * 0.55;
            if (legL) legL.rotation.x = swing;
            if (legR) legR.rotation.x = -swing;
            if (armL) armL.rotation.x = -swing * 0.6;
            if (armR) armR.rotation.x = swing * 0.6;

            const bob = Math.abs(Math.sin(time * 5.0)) * 0.06;
            if (head) head.position.y = 1.05 + bob;
            if (body) body.position.y = 0.55 + bob;
            if (legL) legL.position.y = 0.15 + bob;
            if (legR) legR.position.y = 0.15 + bob;
        } else if (c.animState === 'sitting') {
            if (legL) { legL.rotation.x = -Math.PI / 2; legL.position.set(-0.08, 0.35, 0.12); }
            if (legR) { legR.rotation.x = -Math.PI / 2; legR.position.set(0.08, 0.35, 0.12); }
            if (body) body.position.y = 0.4;
            if (head) head.position.y = 0.9;
            if (armL) { armL.rotation.x = -0.4; armL.position.y = 0.5; }
            if (armR) { armR.rotation.x = -0.4; armR.position.y = 0.5; }
        } else if (c.animState === 'work') {
            const bob = Math.sin(time * 3.0) * 0.03;
            if (head) head.position.y = 1.05 + bob;
            if (armL) { armL.rotation.x = -Math.PI/3 + Math.sin(time*5)*0.1; armL.rotation.z = 0.1; }
            if (armR) { armR.rotation.x = -Math.PI/3 + Math.cos(time*5)*0.1; armR.rotation.z = -0.1; }
        } else {
            const bob = Math.sin(time * 0.8) * 0.02;
            if (head) head.position.y = 1.05 + bob;
        }
    }

    spawnParticles(x, y, z, type) {
        let color = '#ffffff';
        if (type === 'makeup') color = '#e91e63'; // pink
        if (type === 'hair') color = '#ffd700';   // gold
        if (type === 'spa') color = '#e0f7fa';    // steam/blue
        if (type === 'work') color = '#b3e5fc';   // spark blue

        const count = type === 'spa' ? 1 : 3;

        for (let i = 0; i < count; i++) {
            const pMesh = new THREE.Mesh(
                new THREE.SphereGeometry(type === 'spa' ? 0.08 : 0.04, 5, 5),
                new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 })
            );
            
            pMesh.position.set(
                x + (Math.random() * 0.4 - 0.2),
                y + (Math.random() * 0.2),
                z + (Math.random() * 0.4 - 0.2)
            );
            
            this.scene.add(pMesh);

            this.particles.push({
                mesh: pMesh,
                vel: new THREE.Vector3(
                    (Math.random() * 0.3 - 0.15) * 1.5,
                    (Math.random() * 0.5 + 0.3) * (type === 'spa' ? 0.8 : 1.5),
                    (Math.random() * 0.3 - 0.15) * 1.5
                ),
                life: 1.0,
                fadeSpeed: Math.random() * 0.8 + 0.6
            });
        }
    }

    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.mesh.position.addScaledVector(p.vel, dt);
            p.life -= p.fadeSpeed * dt;
            p.mesh.material.opacity = p.life * 0.8;
            p.mesh.scale.setScalar(p.life);

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
                this.particles.splice(i, 1);
            }
        }
    }

    onMouseDown(e) {
        this.dragStart.x = e.clientX;
        this.dragStart.y = e.clientY;
    }

    onMouseUp(e) {
        const dx = e.clientX - this.dragStart.x;
        const dy = e.clientY - this.dragStart.y;
        
        if (Math.sqrt(dx*dx + dy*dy) < 5) {
            this.handleRaycastClick(e);
        }
    }

    handleRaycastClick(e) {
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        
        for (let i = 0; i < intersects.length; i++) {
            let obj = intersects[i].object;
            while (obj && obj.parent) {
                // Check if customer was clicked
                if (obj.userData && obj.userData.customerId) {
                    const customerId = obj.userData.customerId;
                    const customer = this.game.customers.find(cust => cust.id === customerId);
                    if (customer && customer.state === 'in_service') {
                        // Open interactive manual service mini-game modal!
                        this.ui.startMiniGame(customer);
                        return;
                    }
                }
                
                // Check if room was clicked
                if (obj.userData && obj.userData.roomId) {
                    const roomId = obj.userData.roomId;
                    const room = this.game.rooms[roomId];
                    this.ui.openModal('build_upgrade', { id: roomId, built: room.built, level: room.level });
                    return;
                }
                obj = obj.parent;
            }
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate(dt) {
        this.updateParticles(dt);
        this.updateCharacters(dt);

        // Spin lock icons
        Object.keys(this.roomGroups).forEach(roomId => {
            const grp = this.roomGroups[roomId];
            const lock = grp.getObjectByName('lockVisual');
            if (lock) {
                lock.rotation.y = Date.now() * 0.0015;
                lock.position.y = 1.0 + Math.sin(Date.now() * 0.003) * 0.08;
            }
        });

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}
