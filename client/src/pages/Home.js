import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 3rem;
  margin-bottom: 2rem;
  color: var(--text-primary);
  text-shadow: 0 0 15px var(--accent-blue);
`;

const Description = styled.p`
  font-size: 1.2rem;
  max-width: 800px;
  margin-bottom: 3rem;
  color: var(--text-secondary);
  line-height: 1.6;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  
  @media (min-width: 768px) {
    flex-direction: row;
    gap: 3rem;
  }
`;

const Button = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 2rem;
  border-radius: 10px;
  background-color: var(--background-light);
  color: var(--text-primary);
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px var(--shadow-color);
  width: 250px;
  height: 150px;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px var(--shadow-color), 0 0 15px var(--accent-blue);
  }
`;

const ButtonTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  font-family: var(--display-font);
`;

const ButtonDescription = styled.p`
  font-size: 0.9rem;
  color: var(--text-secondary);
`;

function Home() {
  return (
    <HomeContainer>
      <Title>Vinn Så Mye Som Mulig</Title>
      <Description>
        Et strategispill der fire grupper må balansere samarbeid og egoisme for å maksimere sin gevinst. 
        Velg «X» eller «Y» i hver runde, og se hvordan dine valg påvirker både din egen og de andre gruppenes poengsum.
        Gjennom 10 runder med økende intensitet, testes gruppenes strategi og samarbeidsvilje.
      </Description>
      
      <ButtonContainer>
        <Button to="/main">
          <ButtonTitle>Hovedskjerm</ButtonTitle>
          <ButtonDescription>Vis poengtavle og spillstatus</ButtonDescription>
        </Button>
        
        <Button to="/group">
          <ButtonTitle>Bli med som gruppe</ButtonTitle>
          <ButtonDescription>Delta i spillet som en av de fire gruppene</ButtonDescription>
        </Button>
      </ButtonContainer>
    </HomeContainer>
  );
}

export default Home; 