$blue-primary: #1976d2;
$blue-light: #e8f0fe;
$bg-body: #f8fafc;
$white: #ffffff;
$text-dark: #1e293b;
$text-muted: #64748b;

$color-free: #cbd5e1;
$color-active: #3b82f6;
$color-bill: #f59e0b;

.panel-container {
  font-family: 'Segoe UI', system-ui, sans-serif;
  background-color: $bg-body;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

// TOP NAVBAR
.navbar {
  background-color: $blue-primary;
  color: $white;
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;
    .icon-user { font-size: 22px; background: rgba(255, 255, 255, 0.2); padding: 6px; border-radius: 50%; }
    .user-text {
      display: flex; flex-direction: column;
      .title { font-size: 11px; opacity: 0.85; text-transform: uppercase; letter-spacing: 0.5px; }
      .name { font-weight: 600; font-size: 15px; }
    }
  }

  .stats-and-actions {
    display: flex;
    align-items: center;
    gap: 32px;

    .stats {
      display: flex;
      gap: 20px;
      font-size: 13px;

      .stat-item {
        display: flex; align-items: center; gap: 6px;
        .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
        &.active .dot { background-color: $white; }
        &.bill .dot { background-color: $color-bill; }
        &.free .dot { background-color: rgba(255, 255, 255, 0.5); }
      }
    }

    .time-exit {
      display: flex; align-items: center; gap: 24px;
      .time { font-size: 13px; opacity: 0.9; }
      .btn-exit {
        background: transparent; border: none; color: $white; font-weight: 600; cursor: pointer; font-size: 13px;
        &:hover { opacity: 0.8; }
      }
    }
  }
}

// GRID LAYOUT PRINCIPAL
.main-content {
  display: grid;
  grid-template-columns: 260px 1fr 320px;
  flex-grow: 1;
  height: calc(100vh - 65px);
  overflow: hidden;
}

// APARTADO IZQUIERDO: MAPA DE MESAS
.sidebar-mesas {
  background-color: $white;
  border-right: 1px solid #e2e8f0;
  padding: 20px;
  display: flex;
  flex-direction: column;

  h3 { font-size: 12px; color: $text-muted; margin-bottom: 20px; letter-spacing: 0.8px; font-weight: 700; }

  .grid-mesas {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    flex-grow: 1;
    align-content: flex-start;

    .card-mesa {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      height: 65px;
      position: relative;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease-in-out;

      .num-mesa { font-weight: 600; color: #475569; font-size: 15px; }
      .badge-dot { position: absolute; top: 8px; right: 8px; width: 6px; height: 6px; border-radius: 50%; }

      &.libre .badge-dot { background: transparent; }
      &.activa {
        border-color: $color-active; background-color: #f0f6ff;
        .num-mesa { color: $color-active; }
        .badge-dot { background: $color-active; }
      }
      &.cuenta {
        border-color: $color-bill; background-color: #fffbeb;
        .num-mesa { color: $color-bill; }
        .badge-dot { background: $color-bill; }
      }
      &.selected { box-shadow: 0 0 0 2.5px $blue-primary; }
      &:hover { transform: scale(1.03); }
    }
  }

  .leyenda {
    border-top: 1px solid #f1f5f9; padding-top: 16px;
    h4 { font-size: 11px; color: $text-muted; margin-bottom: 10px; font-weight: 700; }
    .leyenda-item {
      display: flex; align-items: center; gap: 10px; font-size: 13px; color: $text-dark; margin-bottom: 8px;
      .dot { width: 10px; height: 10px; border-radius: 50%; border: 1px solid #cbd5e1;
        &.free { background: $white; }
        &.active { background: $color-active; border-color: $color-active; }
        &.bill { background: $color-bill; border-color: $color-bill; }
      }
    }
  }
}

// CONTENEDOR CENTRAL: FILTRO Y MENÚ
.menu-section {
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;

  .info-helper {
    background-color: #f1f5f9; color: #475569;
    padding: 12px 16px; border-radius: 8px; font-size: 14px; border-left: 4px solid #cbd5e1;
    &.selected { background-color: #ecfdf5; color: #065f46; border-left-color: #34d399; }
  }

  .categories-nav {
    display: flex; gap: 8px; border-bottom: 1px solid #e2e8f0;
    button {
      background: none; border: none; padding: 12px 18px; font-size: 14px; cursor: pointer; color: $text-muted;
      border-bottom: 3px solid transparent; transition: all 0.2s;
      &.active { color: $blue-primary; border-bottom-color: $blue-primary; font-weight: 600; }
    }
  }

  .grid-productos {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px;

    .card-producto {
      background: $white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;
      display: flex; gap: 16px; align-items: center; transition: box-shadow 0.2s, transform 0.2s;

      &:hover { box-shadow: 0 6px 16px rgba(0,0,0,0.04); transform: translateY(-1px); }
      .prod-img { font-size: 30px; background: #f8fafc; padding: 12px; border-radius: 50%; width: 34px; height: 34px; display:flex; align-items:center; justify-content:center;}

      .prod-details {
        flex-grow: 1;
        h4 { margin: 0 0 4px; font-size: 14px; color: $text-dark; font-weight: 600; }
        p { margin: 0 0 12px; font-size: 12px; color: $text-muted; line-height: 1.4; }

        .prod-footer {
          display: flex; justify-content: space-between; align-items: center;
          .price { font-weight: 700; color: $blue-primary; font-size: 15px; }
          .btn-add {
            background-color: #f1f5f9; border: none; padding: 6px 14px; border-radius: 20px;
            color: $blue-primary; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;
            &:disabled { opacity: 0.4; cursor: not-allowed; }
            &:not(:disabled):hover { background-color: $blue-light; }
          }
        }
      }
    }
  }
}

// PANEL DE COMANDAS DERECHO
.sidebar-pedido {
  background-color: $white; border-left: 1px solid #e2e8f0; padding: 20px;
  display: flex; flex-direction: column;

  h3 { font-size: 15px; color: $text-dark; margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; font-weight: 600;}

  .empty-cart {
    flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: $text-muted;
    .cart-icon { font-size: 42px; opacity: 0.25; margin-bottom: 12px; }
    p { margin: 0; font-weight: 600; font-size: 14px; }
    span { font-size: 12px; opacity: 0.7; margin-top: 4px; }
  }

  .cart-content {
    display: flex; flex-direction: column; flex-grow: 1; justify-content: space-between;

    .cart-items-list {
      overflow-y: auto; max-height: 55vh;
      .cart-item {
        display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f1f5f9;
        .item-info {
          display: flex; flex-direction: column; gap: 2px;
          .item-name { font-size: 13px; font-weight: 600; color: $text-dark; }
          .item-price { font-size: 12px; color: $text-muted; }
        }
        .item-controls {
          display: flex; align-items: center; gap: 10px;
          button { width: 26px; height: 26px; border-radius: 50%; border: 1px solid #cbd5e1; background: $white; cursor: pointer; font-weight: 600; &:hover { background: #f8fafc;} }
          .qty { font-size: 13px; font-weight: 700; min-width: 14px; text-align: center; color: $text-dark; }
        }
      }
    }

    .cart-summary {
      border-top: 2px dashed #e2e8f0; padding-top: 16px;
      .total-row {
        display: flex; justify-content: space-between; font-size: 15px; margin-bottom: 16px; align-items: center;
        strong { color: $blue-primary; font-size: 20px; font-weight: 700; }
      }
      .cart-actions {
        display: flex; flex-direction: column; gap: 8px;
        button { padding: 14px; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; width: 100%; font-size: 14px; transition: opacity 0.2s; &:hover { opacity: 0.9; } }
        .btn-bill { background-color: $color-bill; color: #fff; }
        .btn-free { background-color: #10b981; color: $white; }
      }
    }
  }
}

// SOPORTE FLOTANTE
.btn-help {
  position: absolute; bottom: 20px; right: 20px; width: 38px; height: 38px;
  background-color: $white; border: 1px solid #cbd5e1; border-radius: 50%;
  font-weight: 600; color: $text-muted; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.06);
  &:hover { background-color: #f8fafc; }
}